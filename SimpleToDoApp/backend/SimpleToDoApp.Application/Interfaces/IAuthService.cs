using System.Threading.Tasks;
using SimpleToDoApp.Application.DTOs.Auth;

namespace SimpleToDoApp.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse> RegisterAsync(RegisterRequest request, string appBaseUrl);
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<UserDto> GetCurrentUserAsync(int userId);
        Task SendVerificationEmailAsync(int userId, string appBaseUrl);
        Task VerifyEmailAsync(string token);
        Task ForgotPasswordAsync(string email, string appBaseUrl);
        Task ResetPasswordAsync(string token, string newPassword);
    }
}
