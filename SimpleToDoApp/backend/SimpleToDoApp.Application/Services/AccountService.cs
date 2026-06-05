using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SimpleToDoApp.Application.DTOs.Auth;
using SimpleToDoApp.Application.Interfaces;
using SimpleToDoApp.Domain.Entities;

namespace SimpleToDoApp.Application.Services
{
    public class AccountService : IAccountService
    {
        private readonly ITodoDbContext _context;
        private readonly IPasswordHasher _passwordHasher;

        public AccountService(ITodoDbContext context, IPasswordHasher passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        public async Task<IEnumerable<UserDto>> GetAllAccountsAsync()
        {
            var accounts = await _context.Accounts
                .Include(a => a.Department)
                .ToListAsync();

            return accounts.Select(MapToDto);
        }

        public async Task<UserDto> CreateAccountAsync(CreateAccountRequest request)
        {
            if (await _context.Accounts.AnyAsync(a => a.Email == request.Email))
            {
                throw new ArgumentException("Email already exists.");
            }
            if (await _context.Accounts.AnyAsync(a => a.Username == request.Username))
            {
                throw new ArgumentException("Username already exists.");
            }

            var account = new Account
            {
                Username = request.Username,
                Email = request.Email,
                Password = _passwordHasher.HashPassword(request.Password),
                Role = request.Role,
                DepartmentId = request.DepartmentId,
                IsEmailVerified = true // Admin created accounts are verified by default
            };

            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();

            if (account.DepartmentId.HasValue)
            {
                account.Department = await _context.Departments.FindAsync(account.DepartmentId);
            }

            return MapToDto(account);
        }

        public async Task<UserDto> UpdateAccountAsync(int userId, UpdateAccountRequest request)
        {
            var account = await _context.Accounts.FindAsync(userId);
            if (account == null)
            {
                throw new KeyNotFoundException("Account not found.");
            }

            if (account.Email != request.Email && await _context.Accounts.AnyAsync(a => a.Email == request.Email))
            {
                throw new ArgumentException("Email already exists.");
            }
            if (account.Username != request.Username && await _context.Accounts.AnyAsync(a => a.Username == request.Username))
            {
                throw new ArgumentException("Username already exists.");
            }

            account.Username = request.Username;
            account.Email = request.Email;
            account.Role = request.Role;
            account.DepartmentId = request.DepartmentId;

            if (!string.IsNullOrEmpty(request.Password))
            {
                account.Password = _passwordHasher.HashPassword(request.Password);
            }

            await _context.SaveChangesAsync();

            if (account.DepartmentId.HasValue)
            {
                account.Department = await _context.Departments.FindAsync(account.DepartmentId);
            }

            return MapToDto(account);
        }

        public async Task<bool> DeleteAccountAsync(int userId)
        {
            var account = await _context.Accounts.FindAsync(userId);
            if (account == null)
            {
                return false;
            }

            if (account.Email == "admin@company.com")
            {
                throw new ArgumentException("Cannot delete the default admin account.");
            }

            _context.Accounts.Remove(account);
            await _context.SaveChangesAsync();
            return true;
        }

        private static UserDto MapToDto(Account account)
        {
            return new UserDto
            {
                UserId = account.UserId,
                Username = account.Username,
                Email = account.Email,
                Role = account.Role,
                DepartmentId = account.DepartmentId,
                DepartmentName = account.Department?.Name
            };
        }
    }
}
