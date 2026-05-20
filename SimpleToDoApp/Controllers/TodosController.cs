using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SimpleToDoApp.Models;

namespace SimpleToDoApp.Controllers
{
    public class TodosController : Controller
    {
        private readonly TodoDbContext _context;

        public TodosController(TodoDbContext context)
        {
            _context = context;
        }

        // 1. Display a list of all to-do items
        public async Task<IActionResult> Index()
        {
            var userId = HttpContext.Session.GetString("UserId");
            if (ModelState.IsValid)
            {
                if (string.IsNullOrEmpty(userId))
                {
                    return RedirectToAction("Login", "Accounts");
                }
            }

            return View(await _context.Todos.Where(t => t.UserId == int.Parse(userId)).ToListAsync());
        }

        // 2. Display details of a specific to-do item
        public async Task<IActionResult> DetailTodos(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var userIdStr = HttpContext.Session.GetString("UserId");

            if (string.IsNullOrEmpty(userIdStr))
            {
                return RedirectToAction("Login", "Accounts");
            }

            var userId = int.Parse(userIdStr);

            var todo = await _context.Todos.FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);

            if (todo == null)
            {
                return NotFound();
            }

            return View(todo);
        }

        // 3. Add a new to-do item
        [HttpGet]
        public IActionResult AddNewTodos()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddNewTodos([Bind("Id, Title, Description, IsCompleted, Category, Priority, Status, IsAllDay, ReminderMinutes, CreatedAt, StartDate, DueDate, UserId")] Todo todo)
        {
            if (ModelState.IsValid)
            {
                var userIdStr = HttpContext.Session.GetString("UserId");

                if (string.IsNullOrEmpty(userIdStr))
                {
                    return RedirectToAction("Login", "Accounts");
                }

                todo.UserId = int.Parse(userIdStr);
                todo.CreatedAt = DateTime.Now;

                _context.Add(todo);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }

            return View(todo);
        }

        // 4. Edit an existing to-do item
        [HttpGet]
        public async Task<IActionResult> EditTodos(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var userIdStr = HttpContext.Session.GetString("UserId");

            if (string.IsNullOrEmpty(userIdStr))
            {
                return RedirectToAction("Login", "Accounts");
            }

            var userId = int.Parse(userIdStr);

            var todo = await _context.Todos.FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);

            if (todo == null)
            {
                return NotFound();
            }
            return View(todo);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditTodos(int id, [Bind("Id, Title, Description, IsCompleted, Category, Priority, Status, IsAllDay, ReminderMinutes, CreatedAt, StartDate, DueDate, UserId")] Todo todo)
        {
            if (id != todo.Id)
            {
                return NotFound();
            }

            var userIdStr = HttpContext.Session.GetString("UserId");

            if (string.IsNullOrEmpty(userIdStr))
            {
                return RedirectToAction("Login", "Accounts");
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(todo);
                    await _context.SaveChangesAsync();

                    return RedirectToAction(nameof(Index));
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!TodoExists(todo.Id)) return NotFound();
                    else throw;
                }
            }

            return View(todo);
        }

        // Helper method to check if a to-do item exists
        public bool TodoExists(int id)
        {
            return _context.Todos.Any(e => e.Id == id);
        }

        // 5. Delete a to-do item
        [HttpGet]
        public async Task<IActionResult> DeleteTodos(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var userIdStr = HttpContext.Session.GetString("UserId");

            if (string.IsNullOrEmpty(userIdStr))
            {
                return RedirectToAction("Login", "Accounts");
            }

            var userId = int.Parse(userIdStr);

            var todo = await _context.Todos.FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);

            if (todo == null)
            {
                return NotFound();
            }
            return View(todo);
        }

        [HttpPost, ActionName("DeleteTodos")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteTodos(int id)
        {
            var todo = await _context.Todos.FindAsync(id);
            if (todo != null)
            {
                _context.Todos.Remove(todo);
                await _context.SaveChangesAsync();
            }
            TempData["Message"] = "To-do item deleted successfully.";
            return RedirectToAction(nameof(Index));
        }

        // 6. Display a calendar view of to-do items
        [HttpGet]
        public async Task<JsonResult> GetCalendar()
        {
            var userIdStr = (HttpContext.Session.GetString("UserId") ?? "0");

            var events = await _context.Todos
                .Where(t => t.UserId == int.Parse(userIdStr))
                .Select(t => new
                {
                    id = t.Id,
                    title = t.Title,
                    start = t.StartDate.ToString("yyyy-MM-ddTHH:mm:ss"),
                    end = t.DueDate.ToString("yyyy-MM-ddTHH:mm:ss"),
                    allDay = t.IsAllDay,

                    backgroundColor = t.IsCompleted ? "#10b981" : "#4f46e5",
                    borderColor = t.IsCompleted ? "#10b981" : "#4f46e5"
                })
                .ToListAsync();
            return Json(events);
        }

        [HttpGet]
        public IActionResult Calendars()
        {
            return View();
        }

        // 7. Display a Kanban board view of to-do items
        [HttpGet]
        public async Task<IActionResult> Board()
        {
            var userIdStr = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userIdStr)) return RedirectToAction("Login", "Accounts");

            var userId = int.Parse(userIdStr);
            var todos = await _context.Todos
                .Where(t => t.UserId == userId)
                .ToListAsync();

            return View(todos);
        }

        [HttpPost]
        public async Task<IActionResult> UpdateStatus(int id, string status)
        {
            var todo = await _context.Todos.FindAsync(id);
            if (todo != null)
            {
                todo.Status = status;

                todo.IsCompleted = (status == "Done");
                await _context.SaveChangesAsync();
                return Ok();
            }
            return NotFound();
        }
    }
}
