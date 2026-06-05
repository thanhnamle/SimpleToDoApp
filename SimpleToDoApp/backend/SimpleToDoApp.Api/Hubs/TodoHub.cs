using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace SimpleToDoApp.Api.Hubs
{
    public class TodoHub : Hub
    {
        // Hub logic can be expanded later if clients need to send messages to the server.
        // For now, the server will broadcast to clients using IHubContext.
    }
}
