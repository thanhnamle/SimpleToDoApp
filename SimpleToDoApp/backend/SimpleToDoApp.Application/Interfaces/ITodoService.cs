using System.Collections.Generic;
using System.Threading.Tasks;
using SimpleToDoApp.Application.DTOs.Todos;

namespace SimpleToDoApp.Application.Interfaces
{
    public interface ITodoService
    {
        Task<IEnumerable<TodoDto>> GetUserTodosAsync(int userId);
        Task<TodoDto?> GetTodoByIdAsync(int id, int userId);
        Task<TodoDto> CreateTodoAsync(CreateTodoRequest request, int userId);
        Task<TodoDto?> UpdateTodoAsync(int id, UpdateTodoRequest request, int userId);
        Task<TodoDto?> UpdateTodoStatusAsync(int id, UpdateTodoStatusRequest request, int userId);
        Task<bool> DeleteTodoAsync(int id, int userId);
        Task<IEnumerable<TodoDto>> GetUserCalendarTodosAsync(int userId);
    }
}
