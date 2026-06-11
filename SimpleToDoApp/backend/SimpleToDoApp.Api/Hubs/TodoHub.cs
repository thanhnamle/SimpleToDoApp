using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace SimpleToDoApp.Api.Hubs
{
    public class TodoHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var user = Context.User;
            if (user?.Identity?.IsAuthenticated == true)
            {
                var userId = user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                var role = user.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
                var departmentId = user.FindFirst("DepartmentId")?.Value;

                if (!string.IsNullOrEmpty(userId))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
                }

                if (!string.IsNullOrEmpty(departmentId))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"Dept_{departmentId}");
                }

                if (role == "DepartmentHead")
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, "GlobalAdmin");
                }
            }

            await base.OnConnectedAsync();
        }
    }
}
