using System.Threading.Tasks;
using SimpleToDoApp.Application.DTOs.Todos;

namespace SimpleToDoApp.Application.Interfaces
{
    public interface ITodoNotificationService
    {
        Task NotifyTodoUpdatedAsync(TodoDto dto);
    }
}
