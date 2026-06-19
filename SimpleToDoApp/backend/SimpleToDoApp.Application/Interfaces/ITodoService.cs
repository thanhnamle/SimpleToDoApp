using System.Collections.Generic;
using System.Threading.Tasks;
using SimpleToDoApp.Application.DTOs.Todos;

namespace SimpleToDoApp.Application.Interfaces
{
    public interface ITodoService
    {
        Task<IEnumerable<TodoDto>> GetUserTodosAsync(int userId, SimpleToDoApp.Domain.Enums.UserRole role, int? departmentId);
        Task<TodoDto?> GetTodoByIdAsync(int id, int userId, SimpleToDoApp.Domain.Enums.UserRole role, int? departmentId);
        Task<TodoDto> CreateTodoAsync(CreateTodoRequest request, int userId, SimpleToDoApp.Domain.Enums.UserRole role, int? departmentId);
        Task<TodoDto?> UpdateTodoAsync(int id, UpdateTodoRequest request, int userId, SimpleToDoApp.Domain.Enums.UserRole role, int? departmentId);
        Task<TodoDto?> UpdateTodoStatusAsync(int id, UpdateTodoStatusRequest request, int userId, SimpleToDoApp.Domain.Enums.UserRole role, int? departmentId);
        Task<bool> DeleteTodoAsync(int id, int userId, SimpleToDoApp.Domain.Enums.UserRole role, int? departmentId);
        Task<IEnumerable<TodoDto>> GetUserCalendarTodosAsync(int userId, SimpleToDoApp.Domain.Enums.UserRole role, int? departmentId);
        Task SeedTasksAsync(int userId, int? departmentId);
        Task<PagedResult<TodoDto>> GetUserTodosAsync(TodoQueryParameters queryParameters, int userId, SimpleToDoApp.Domain.Enums.UserRole role, int? departmentId);
        Task<IEnumerable<string>> GetCategoriesAsync(int userId, SimpleToDoApp.Domain.Enums.UserRole role, int? departmentId);
    }
}
