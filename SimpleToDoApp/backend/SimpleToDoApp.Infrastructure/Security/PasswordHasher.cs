using SimpleToDoApp.Application.Interfaces;

namespace SimpleToDoApp.Infrastructure.Security
{
    public class PasswordHasher : IPasswordHasher
    {
        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public bool VerifyPassword(string password, string hashedPassword)
        {
            try
            {
                return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
            }
            catch
            {
                // In case the password in database is legacy plain text or corrupted hash, fallback/return false
                return false;
            }
        }
    }
}
