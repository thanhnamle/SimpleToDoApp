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
        private readonly ITodoNotificationService _notificationService;

        public TodoService(ITodoDbContext context, ITodoNotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<IEnumerable<TodoDto>> GetUserTodosAsync(int userId, UserRole role, int? departmentId)
        {
            var query = _context.Todos.Include(t => t.Account).AsQueryable();
            query = ApplyRoleFilter(query, userId, role, departmentId);

            var todos = await query
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return todos.Select(MapToDto);
        }

        public async Task<TodoDto?> GetTodoByIdAsync(int id, int userId, UserRole role, int? departmentId)
        {
            var query = _context.Todos.Include(t => t.Account).Where(t => t.Id == id);
            query = ApplyRoleFilter(query, userId, role, departmentId);

            var todo = await query.FirstOrDefaultAsync();
            return todo == null ? null : MapToDto(todo);
        }

        public async Task<TodoDto> CreateTodoAsync(CreateTodoRequest request, int userId, UserRole role, int? departmentId)
        {
            if (!Enum.TryParse<TodoPriority>(request.Priority, true, out var priority))
            {
                throw new ArgumentException($"Invalid priority value: {request.Priority}. Allowed values: Low, Medium, High.");
            }

            if (!Enum.TryParse<TodoStatus>(request.Status, true, out var status))
            {
                throw new ArgumentException($"Invalid status value: {request.Status}. Allowed values: Pending, InProgress, Done.");
            }

            var assignedUserId = userId;
            if (request.AssignedUserId.HasValue)
            {
                var assignedUser = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == request.AssignedUserId.Value);
                if (assignedUser == null)
                {
                    throw new ArgumentException("Assigned user does not exist.");
                }

                if (role == UserRole.Leader && assignedUser.DepartmentId != departmentId)
                {
                    throw new ArgumentException("Cannot assign task to a user who is not in your department.");
                }
                
                assignedUserId = request.AssignedUserId.Value;
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
                UserId = assignedUserId,
                CreatedAt = DateTime.Now
            };

            _context.Todos.Add(todo);
            await _context.SaveChangesAsync();

            todo.Account = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == assignedUserId);
            var dto = MapToDto(todo);

            await _notificationService.NotifyTodoUpdatedAsync(dto);

            return dto;
        }

        public async Task<TodoDto?> UpdateTodoAsync(int id, UpdateTodoRequest request, int userId, UserRole role, int? departmentId)
        {
            var query = _context.Todos.Include(t => t.Account).Where(t => t.Id == id);
            query = ApplyRoleFilter(query, userId, role, departmentId);

            var todo = await query.FirstOrDefaultAsync();
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

            if (request.AssignedUserId.HasValue && request.AssignedUserId.Value != todo.UserId)
            {
                var assignedUser = await _context.Accounts.FirstOrDefaultAsync(a => a.UserId == request.AssignedUserId.Value);
                if (assignedUser == null)
                {
                    throw new ArgumentException("Assigned user does not exist.");
                }

                if (role == UserRole.Leader && assignedUser.DepartmentId != departmentId)
                {
                    throw new ArgumentException("Cannot assign task to a user who is not in your department.");
                }
                
                todo.UserId = request.AssignedUserId.Value;
                todo.Account = assignedUser;
            }

            todo.Title = request.Title;
            todo.Description = request.Description;
            todo.Category = request.Category;
            todo.Priority = priority;
            todo.Status = status;
            todo.IsCompleted = request.IsCompleted || (status == TodoStatus.Done);
            if (status == TodoStatus.Done)
            {
                todo.IsCompleted = true;
            }
            else if (!request.IsCompleted && todo.Status == TodoStatus.Done)
            {
                todo.Status = TodoStatus.InProgress;
            }

            todo.IsAllDay = request.IsAllDay;
            todo.StartDate = request.StartDate;
            todo.DueDate = request.DueDate;
            todo.ReminderMinutes = request.ReminderMinutes;

            await _context.SaveChangesAsync();

            var dto = MapToDto(todo);
            await _notificationService.NotifyTodoUpdatedAsync(dto);

            return dto;
        }

        public async Task<TodoDto?> UpdateTodoStatusAsync(int id, UpdateTodoStatusRequest request, int userId, UserRole role, int? departmentId)
        {
            var query = _context.Todos.Include(t => t.Account).Where(t => t.Id == id);
            query = ApplyRoleFilter(query, userId, role, departmentId);

            var todo = await query.FirstOrDefaultAsync();
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

            var dto = MapToDto(todo);
            await _notificationService.NotifyTodoUpdatedAsync(dto);

            return dto;
        }

        public async Task<bool> DeleteTodoAsync(int id, int userId, UserRole role, int? departmentId)
        {
            var query = _context.Todos.Include(t => t.Account).Where(t => t.Id == id);
            query = ApplyRoleFilter(query, userId, role, departmentId);

            var todo = await query.FirstOrDefaultAsync();
            if (todo == null)
            {
                return false;
            }

            _context.Todos.Remove(todo);
            await _context.SaveChangesAsync();

            await _notificationService.NotifyTodoUpdatedAsync(null!); // broadcast that something changed

            return true;
        }

        public async Task<IEnumerable<TodoDto>> GetUserCalendarTodosAsync(int userId, UserRole role, int? departmentId)
        {
            var query = _context.Todos.Include(t => t.Account).AsQueryable();
            query = ApplyRoleFilter(query, userId, role, departmentId);

            var todos = await query
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
                ReminderMinutes = todo.ReminderMinutes,
                AssignedUserId = todo.UserId,
                AssignedUsername = todo.Account?.Username,
                AssignedEmail = todo.Account?.Email,
                DepartmentId = todo.Account?.DepartmentId
            };
        }

        private IQueryable<Todo> ApplyRoleFilter(IQueryable<Todo> query, int userId, UserRole role, int? departmentId)
        {
            if (role == UserRole.User || role == UserRole.Employee)
            {
                return query.Where(t => t.UserId == userId);
            }
            
            if (role == UserRole.Leader)
            {
                return query.Where(t => t.Account != null && t.Account.DepartmentId == departmentId);
            }

            // DepartmentHead acts as Global Admin for enterprise.
            // They see all tasks EXCEPT those belonging to regular external Users or legacy external employees.
            return query.Where(t => t.Account != null && t.Account.Role != UserRole.User && !(t.Account.Role == UserRole.Employee && t.Account.DepartmentId == null));
        }
    }
}
