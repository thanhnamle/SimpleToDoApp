using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SimpleToDoApp.Application.DTOs.Todos;
using SimpleToDoApp.Application.Interfaces;
using SimpleToDoApp.Domain.Entities;
using SimpleToDoApp.Domain.Enums;

namespace SimpleToDoApp.Application.Services
{
    public class TodoService : ITodoService
    {
        private readonly ITodoDbContext _context;

        public TodoService(ITodoDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TodoDto>> GetUserTodosAsync(int userId)
        {
            var todos = await _context.Todos
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return todos.Select(MapToDto);
        }

        public async Task<TodoDto?> GetTodoByIdAsync(int id, int userId)
        {
            var todo = await _context.Todos
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            return todo == null ? null : MapToDto(todo);
        }

        public async Task<TodoDto> CreateTodoAsync(CreateTodoRequest request, int userId)
        {
            if (!Enum.TryParse<TodoPriority>(request.Priority, true, out var priority))
            {
                throw new ArgumentException($"Invalid priority value: {request.Priority}. Allowed values: Low, Medium, High.");
            }

            if (!Enum.TryParse<TodoStatus>(request.Status, true, out var status))
            {
                throw new ArgumentException($"Invalid status value: {request.Status}. Allowed values: Pending, InProgress, Done.");
            }

            var todo = new Todo
            {
                Title = request.Title,
                Description = request.Description,
                IsCompleted = (status == TodoStatus.Done),
                Category = request.Category,
                Priority = priority,
                Status = status,
                IsAllDay = request.IsAllDay,
                StartDate = request.StartDate,
                DueDate = request.DueDate,
                ReminderMinutes = request.ReminderMinutes,
                UserId = userId,
                CreatedAt = DateTime.Now
            };

            _context.Todos.Add(todo);
            await _context.SaveChangesAsync();

            return MapToDto(todo);
        }

        public async Task<TodoDto?> UpdateTodoAsync(int id, UpdateTodoRequest request, int userId)
        {
            var todo = await _context.Todos
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (todo == null)
            {
                return null;
            }

            if (!Enum.TryParse<TodoPriority>(request.Priority, true, out var priority))
            {
                throw new ArgumentException($"Invalid priority value: {request.Priority}. Allowed values: Low, Medium, High.");
            }

            if (!Enum.TryParse<TodoStatus>(request.Status, true, out var status))
            {
                throw new ArgumentException($"Invalid status value: {request.Status}. Allowed values: Pending, InProgress, Done.");
            }

            todo.Title = request.Title;
            todo.Description = request.Description;
            todo.Category = request.Category;
            todo.Priority = priority;
            todo.Status = status;
            // Update IsCompleted in sync with status if they match, or respect request
            todo.IsCompleted = request.IsCompleted || (status == TodoStatus.Done);
            // If status is Done, IsCompleted must be true.
            if (status == TodoStatus.Done)
            {
                todo.IsCompleted = true;
            }
            // If they marked IsCompleted as false but status is Done, revert status to InProgress/Pending
            else if (!request.IsCompleted && todo.Status == TodoStatus.Done)
            {
                todo.Status = TodoStatus.InProgress;
            }

            todo.IsAllDay = request.IsAllDay;
            todo.StartDate = request.StartDate;
            todo.DueDate = request.DueDate;
            todo.ReminderMinutes = request.ReminderMinutes;

            await _context.SaveChangesAsync();

            return MapToDto(todo);
        }

        public async Task<TodoDto?> UpdateTodoStatusAsync(int id, UpdateTodoStatusRequest request, int userId)
        {
            var todo = await _context.Todos
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (todo == null)
            {
                return null;
            }

            if (!Enum.TryParse<TodoStatus>(request.Status, true, out var status))
            {
                throw new ArgumentException($"Invalid status value: {request.Status}. Allowed values: Pending, InProgress, Done.");
            }

            todo.Status = status;
            todo.IsCompleted = (status == TodoStatus.Done);

            await _context.SaveChangesAsync();

            return MapToDto(todo);
        }

        public async Task<bool> DeleteTodoAsync(int id, int userId)
        {
            var todo = await _context.Todos
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (todo == null)
            {
                return false;
            }

            _context.Todos.Remove(todo);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<TodoDto>> GetUserCalendarTodosAsync(int userId)
        {
            // For calendar, we fetch all user tasks that have start/due dates
            var todos = await _context.Todos
                .Where(t => t.UserId == userId)
                .OrderBy(t => t.StartDate)
                .ToListAsync();

            return todos.Select(MapToDto);
        }

        private static TodoDto MapToDto(Todo todo)
        {
            return new TodoDto
            {
                Id = todo.Id,
                Title = todo.Title,
                Description = todo.Description,
                IsCompleted = todo.IsCompleted,
                Category = todo.Category,
                Priority = todo.Priority.ToString(),
                Status = todo.Status.ToString(),
                IsAllDay = todo.IsAllDay,
                CreatedAt = todo.CreatedAt,
                StartDate = todo.StartDate,
                DueDate = todo.DueDate,
                ReminderMinutes = todo.ReminderMinutes
            };
        }
    }
}
