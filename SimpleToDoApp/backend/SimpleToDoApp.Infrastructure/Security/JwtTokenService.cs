using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SimpleToDoApp.Application.Interfaces;
using SimpleToDoApp.Domain.Entities;

namespace SimpleToDoApp.Infrastructure.Security
{
    public class JwtTokenService : IJwtTokenService
    {
        private readonly IConfiguration _configuration;

        public JwtTokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public (string Token, DateTime ExpiresAt) GenerateToken(Account account)
        {
            var keyStr = _configuration["Jwt:Key"] ?? "super_secret_key_that_must_be_at_least_32_characters_long_for_security";
            var issuer = _configuration["Jwt:Issuer"] ?? "SimpleToDoAppApi";
            var audience = _configuration["Jwt:Audience"] ?? "SimpleToDoAppClient";
            var expiresMinutesStr = _configuration["Jwt:ExpiresInMinutes"] ?? "1440"; // default 1 day

            if (!double.TryParse(expiresMinutesStr, out var expiresMinutes))
            {
                expiresMinutes = 1440;
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyStr));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claimsList = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, account.UserId.ToString()),
                new Claim(ClaimTypes.Name, account.Username),
                new Claim(ClaimTypes.Email, account.Email),
                new Claim(ClaimTypes.Role, account.Role.ToString())
            };

            if (account.DepartmentId.HasValue)
            {
                claimsList.Add(new Claim("DepartmentId", account.DepartmentId.Value.ToString()));
            }

            var claims = claimsList.ToArray();

            var expiresAt = DateTime.UtcNow.AddMinutes(expiresMinutes);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: creds);

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
            return (tokenString, expiresAt);
        }
    }
}
