using System.Collections.Generic;
using System.Threading.Tasks;
using SimpleToDoApp.Application.DTOs.Auth;

namespace SimpleToDoApp.Application.Interfaces
{
    public interface IAccountService
    {
        Task<IEnumerable<UserDto>> GetAllAccountsAsync();
        Task<UserDto> CreateAccountAsync(CreateAccountRequest request);
        Task<UserDto> UpdateAccountAsync(int userId, UpdateAccountRequest request);
        Task<bool> DeleteAccountAsync(int userId);
    }
}
