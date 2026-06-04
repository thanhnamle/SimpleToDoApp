using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SimpleToDoApp.Application.DTOs.Auth;
using SimpleToDoApp.Application.Interfaces;
using SimpleToDoApp.Domain.Entities;

namespace SimpleToDoApp.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly ITodoDbContext _context;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IEmailService _emailService;

        public AuthService(ITodoDbContext context, IPasswordHasher passwordHasher, IJwtTokenService jwtTokenService, IEmailService emailService)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _jwtTokenService = jwtTokenService;
            _emailService = emailService;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request, string appBaseUrl)
        {
            var existingUser = await _context.Accounts.FirstOrDefaultAsync(a => a.Username == request.Username);
            if (existingUser != null)
            {
                throw new ArgumentException("Username is already taken.");
            }

            var existingEmail = await _context.Accounts.FirstOrDefaultAsync(a => a.Email == request.Email);
            if (existingEmail != null)
            {
                throw new ArgumentException("Email is already registered.");
            }

            // Check if department exists (if provided)
            if (request.DepartmentId.HasValue)
            {
                var departmentExists = await _context.Departments.AnyAsync(d => d.Id == request.DepartmentId.Value);
                if (!departmentExists)
                {
                    throw new ArgumentException("Selected department does not exist.");
                }
            }

            var hashedPassword = _passwordHasher.HashPassword(request.Password);
            var account = new Account
            {
                Username = request.Username,
                Email = request.Email,
                Password = hashedPassword,
                IsEmailVerified = false,
                DepartmentId = request.DepartmentId,
                Role = request.Role
            };

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Accounts.Add(account);
                await _context.SaveChangesAsync();

                // Send verification email
                await SendVerificationEmailAsync(account.UserId, appBaseUrl);

                await transaction.CommitAsync();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw new InvalidOperationException($"Registration failed because the verification email could not be sent: {ex.Message}", ex);
            }

            return new AuthResponse
            {
                Token = string.Empty,
                ExpiresAt = DateTime.UtcNow,
                User = new UserDto
                {
                    UserId = account.UserId,
                    Username = account.Username,
                    Email = account.Email,
                    Role = account.Role,
                    DepartmentId = account.DepartmentId
                }
            };
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => 
                a.Username == request.UsernameOrEmail || a.Email == request.UsernameOrEmail);

            if (account == null || !_passwordHasher.VerifyPassword(request.Password, account.Password))
            {
                throw new UnauthorizedAccessException("Invalid username/email or password.");
            }

            if (!account.IsEmailVerified)
            {
                throw new UnauthorizedAccessException("Please verify your email before logging in.");
            }

            var (token, expiresAt) = _jwtTokenService.GenerateToken(account);

            return new AuthResponse
            {
                Token = token,
                ExpiresAt = expiresAt,
                User = new UserDto
                {
                    UserId = account.UserId,
                    Username = account.Username,
                    Email = account.Email,
                    Role = account.Role,
                    DepartmentId = account.DepartmentId
                }
            };
        }

        public async Task<UserDto> GetCurrentUserAsync(int userId)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == userId);
            if (account == null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            return new UserDto
            {
                UserId = account.UserId,
                Username = account.Username,
                Email = account.Email,
                Role = account.Role,
                DepartmentId = account.DepartmentId
            };
        }

        public async Task SendVerificationEmailAsync(int userId, string appBaseUrl)
        {
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == userId);
            if (account == null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            account.EmailVerificationToken = Guid.NewGuid().ToString("N");
            account.EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24);

            await _context.SaveChangesAsync();

            var verificationUrl = $"{appBaseUrl.TrimEnd('/')}/verify-email?token={account.EmailVerificationToken}";
            var subject = "Verify your ZenTodo account";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                    <h2 style='color: #4f46e5; text-align: center;'>Welcome to ZenTodo!</h2>
                    <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{verificationUrl}' style='background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;'>Verify Email Address</a>
                    </div>
                    <p style='color: #666; font-size: 14px;'>This link will expire in 24 hours. If you did not request this, please ignore this email.</p>
                </div>";

            await _emailService.SendEmailAsync(account.Email, subject, body);
        }

        public async Task VerifyEmailAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                throw new ArgumentException("Token is required.");
            }

            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.EmailVerificationToken == token);
            if (account == null)
            {
                throw new ArgumentException("Invalid email verification token.");
            }

            if (account.EmailVerificationTokenExpiry < DateTime.UtcNow)
            {
                throw new ArgumentException("Verification token has expired.");
            }

            account.IsEmailVerified = true;
            account.EmailVerificationToken = null;
            account.EmailVerificationTokenExpiry = null;

            await _context.SaveChangesAsync();
        }

        public async Task ForgotPasswordAsync(string email, string appBaseUrl)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                throw new ArgumentException("Email is required.");
            }

            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Email == email);
            if (account == null)
            {
                throw new ArgumentException("Email is not registered.");
            }

            var random = new Random();
            var token = random.Next(100000, 999999).ToString();

            account.PasswordResetToken = token;
            account.PasswordResetTokenExpiry = DateTime.UtcNow.AddMinutes(15);

            await _context.SaveChangesAsync();

            var resetUrl = $"{appBaseUrl.TrimEnd('/')}/reset-password?token={token}";
            var subject = "Reset your ZenTodo password";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;'>
                    <h2 style='color: #4f46e5; text-align: center;'>Reset Password Request</h2>
                    <p>We received a request to reset the password for your ZenTodo account.</p>
                    <p>You can reset your password using the button below:</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{resetUrl}' style='background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;'>Reset Password</a>
                    </div>
                    <p>Or you can copy and use this reset token directly in the form:</p>
                    <div style='background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 4px; margin: 20px 0; border: 1px solid #e5e7eb;'>
                        {token}
                    </div>
                    <p style='color: #666; font-size: 14px;'>This code and link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
                </div>";

            await _emailService.SendEmailAsync(account.Email, subject, body);
        }

        public async Task ResetPasswordAsync(string token, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                throw new ArgumentException("Reset token is required.");
            }

            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.PasswordResetToken == token);
            if (account == null)
            {
                throw new ArgumentException("Invalid reset token.");
            }

            if (account.PasswordResetTokenExpiry < DateTime.UtcNow)
            {
                throw new ArgumentException("Reset token has expired.");
            }

            account.Password = _passwordHasher.HashPassword(newPassword);
            account.PasswordResetToken = null;
            account.PasswordResetTokenExpiry = null;

            await _context.SaveChangesAsync();
        }
    }
}
