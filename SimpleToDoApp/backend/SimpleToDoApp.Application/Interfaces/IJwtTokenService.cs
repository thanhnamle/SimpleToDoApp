using System;
using SimpleToDoApp.Domain.Entities;

namespace SimpleToDoApp.Application.Interfaces
{
    public interface IJwtTokenService
    {
        (string Token, DateTime ExpiresAt) GenerateToken(Account account);
    }
}
