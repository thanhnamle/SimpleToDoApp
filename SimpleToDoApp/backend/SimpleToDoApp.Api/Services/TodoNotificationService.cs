using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using SimpleToDoApp.Api.Hubs;
using SimpleToDoApp.Application.DTOs.Todos;
using SimpleToDoApp.Application.Interfaces;

namespace SimpleToDoApp.Api.Services
{
    public class TodoNotificationService : ITodoNotificationService
    {
        private readonly IHubContext<TodoHub> _hubContext;

        public TodoNotificationService(IHubContext<TodoHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task NotifyTodoUpdatedAsync(TodoDto dto)
        {
            if (dto == null) 
            {
                // In case of delete broadcast without dto
                await _hubContext.Clients.All.SendAsync("TodoUpdated", null);
                return;
            }

            // Send to assigned user
            await _hubContext.Clients.Group($"User_{dto.AssignedUserId}").SendAsync("TodoUpdated", dto);

            // Send to department
            if (dto.DepartmentId != null)
            {
                await _hubContext.Clients.Group($"Dept_{dto.DepartmentId}").SendAsync("TodoUpdated", dto);
            }

            // Send to global admins (DepartmentHead)
            await _hubContext.Clients.Group("GlobalAdmin").SendAsync("TodoUpdated", dto);
        }
    }
}
