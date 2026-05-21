using System;
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

        public AuthService(ITodoDbContext context, IPasswordHasher passwordHasher, IJwtTokenService jwtTokenService)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _jwtTokenService = jwtTokenService;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
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

            var hashedPassword = _passwordHasher.HashPassword(request.Password);
            var account = new Account
            {
                Username = request.Username,
                Email = request.Email,
                Password = hashedPassword
            };

            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();

            var (token, expiresAt) = _jwtTokenService.GenerateToken(account);

            return new AuthResponse
            {
                Token = token,
                ExpiresAt = expiresAt,
                User = new UserDto
                {
                    UserId = account.UserId,
                    Username = account.Username,
                    Email = account.Email
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

            var (token, expiresAt) = _jwtTokenService.GenerateToken(account);

            return new AuthResponse
            {
                Token = token,
                ExpiresAt = expiresAt,
                User = new UserDto
                {
                    UserId = account.UserId,
                    Username = account.Username,
                    Email = account.Email
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
                Email = account.Email
            };
        }
    }
}
