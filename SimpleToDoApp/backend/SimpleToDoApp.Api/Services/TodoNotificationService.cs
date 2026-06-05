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
            await _hubContext.Clients.All.SendAsync("TodoUpdated", dto);
        }
    }
}
