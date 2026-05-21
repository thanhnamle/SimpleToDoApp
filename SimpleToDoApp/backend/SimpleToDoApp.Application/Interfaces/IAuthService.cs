using System.Threading.Tasks;
using SimpleToDoApp.Application.DTOs.Auth;

namespace SimpleToDoApp.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse> RegisterAsync(RegisterRequest request);
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<UserDto> GetCurrentUserAsync(int userId);
    }
}
