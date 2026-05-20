using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SimpleToDoApp.Models;

namespace SimpleToDoApp.ViewComponents
{
    public class NotificationBellViewComponent : ViewComponent
    {
        private readonly TodoDbContext _context;

        public NotificationBellViewComponent(TodoDbContext context)
        {
            _context = context;
        }

        public async Task<IViewComponentResult> InvokeAsync()
        {
            var userIdStr = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userIdStr)) {
                return View(new List<Todo>()); 
            }

            var userId = int.Parse(userIdStr);
            var now = DateTime.Now;

            var notifications = await _context.Todos
                .Where(t => t.UserId == userId && !t.IsCompleted &&
                            t.StartDate.AddMinutes(-t.ReminderMinutes) <= now && now <
                            t.StartDate)
                .OrderBy(t => t.StartDate)
                .ToListAsync();

            return View(notifications);
        }
    }
}
