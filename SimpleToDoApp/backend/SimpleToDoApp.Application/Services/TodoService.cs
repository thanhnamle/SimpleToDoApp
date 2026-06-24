using Microsoft.EntityFrameworkCore;
using SimpleToDoApp.Application.DTOs.Todos;
using SimpleToDoApp.Application.Interfaces;
using SimpleToDoApp.Domain.Entities;
using SimpleToDoApp.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Metadata;
using System.Threading.Tasks;

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

        public async Task SeedTasksAsync(int userId, int? departmentId)
        {
            var tasks = new List<Todo>();
            var random = new Random();
            var categories = new[] { "Work", "Personal", "Project", "Shopping", "Meeting" };
            var statuses = new[] { TodoStatus.Pending, TodoStatus.InProgress, TodoStatus.Done };
            var priorities = new[] { TodoPriority.Low, TodoPriority.Medium, TodoPriority.High };

            for (int i = 1; i <= 50; i++)
            {
                var createdAt = DateTime.UtcNow.AddDays(-random.Next(1, 30));
                tasks.Add(new Todo
                {
                    Title = $"Generated Task {i}",
                    Description = $"This is an automatically generated task number {i} for pagination testing.",
                    Status = statuses[random.Next(statuses.Length)],
                    Priority = priorities[random.Next(priorities.Length)],
                    Category = categories[random.Next(categories.Length)],
                    UserId = userId,
                    CreatedAt = createdAt,
                    IsAllDay = false,
                    IsCompleted = false,
                    StartDate = createdAt,
                    DueDate = createdAt.AddDays(random.Next(1, 10)),
                    ReminderMinutes = 15
                });
            }

            _context.Todos.AddRange(tasks);
            await _context.SaveChangesAsync();
        }

        public async Task<PagedResult<TodoDto>> GetUserTodosAsync(TodoQueryParameters parameters, int userId, UserRole role, int? departmentId)
        {
            var query = _context.Todos.Include(t => t.Account).AsQueryable();
            query = ApplyRoleFilter(query, userId, role, departmentId);
            
            if (!string.IsNullOrWhiteSpace(parameters.Search))
            {
                var searchTerm = $"%{parameters.Search}%";
                query = query.Where(t => 
                    Microsoft.EntityFrameworkCore.EF.Functions.ILike(t.Title, searchTerm) || 
                    (t.Description != null && Microsoft.EntityFrameworkCore.EF.Functions.ILike(t.Description, searchTerm)) ||
                    (t.Category != null && Microsoft.EntityFrameworkCore.EF.Functions.ILike(t.Category, searchTerm)));
            }
            
            if (!string.IsNullOrWhiteSpace(parameters.Status) && parameters.Status != "All")
            {
                if (Enum.TryParse<TodoStatus>(parameters.Status, out var status))
                    query = query.Where(t => t.Status == status);
            }
            
            if (!string.IsNullOrWhiteSpace(parameters.Priority) && parameters.Priority != "All")
            {
                if (Enum.TryParse<TodoPriority>(parameters.Priority, out var priority))
                    query = query.Where(t => t.Priority == priority);
            }
            
            if (!string.IsNullOrWhiteSpace(parameters.Category) && parameters.Category != "All")
            {
                query = query.Where(t => t.Category == parameters.Category);
            }
            
            if (parameters.DepartmentId.HasValue)
            {
                query = query.Where(t => t.Account != null && t.Account.DepartmentId == parameters.DepartmentId.Value);
            }
            
            if (parameters.StartDateFrom.HasValue)
            {
                query = query.Where(t => t.DueDate >= parameters.StartDateFrom.Value || t.StartDate >= parameters.StartDateFrom.Value);
            }
            
            if (parameters.StartDateTo.HasValue)
            {
                query = query.Where(t => t.StartDate <= parameters.StartDateTo.Value || t.DueDate <= parameters.StartDateTo.Value);
            }
            
            // 2. Sắp xếp (Sorting)
            if (parameters.Sort == "DueDateAsc")
                query = query.OrderBy(t => t.DueDate);
            else if (parameters.Sort == "DueDateDesc")
                query = query.OrderByDescending(t => t.DueDate);
            else
                query = query.OrderByDescending(t => t.CreatedAt);
            
            // 3. Đếm tổng số lượng (Capped Limit ở 10.000 để bảo vệ DB)
            var actualCount = await query.CountAsync();
            
            // Áp dụng Capped Offset: Nếu số lượng > 10.000, ta chặn lại ở 10.000
            var totalCount = actualCount > 10000 ? 10000 : actualCount;
            var totalPages = (int)Math.Ceiling(totalCount / (double)parameters.PageSize);
            
            // 4. Lấy dữ liệu theo trang (Skip & Take)
            var todos = await query
                .Skip((parameters.PageNumber - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();
            
            return new PagedResult<TodoDto>
            {
                Items = todos.Select(MapToDto),
                TotalCount = totalCount,
                TotalPages = totalPages,
                CurrentPage = parameters.PageNumber,
                PageSize = parameters.PageSize
            };
        }

        public async Task<TodoStatsDto> GetTodoStatsAsync(int userId, UserRole role, int? departmentId)
        {
            var query = _context.Todos.AsQueryable();
            query = ApplyRoleFilter(query, userId, role, departmentId);

            var total = await query.CountAsync();
            var pending = await query.CountAsync(t => t.Status == TodoStatus.Pending);
            var inProgress = await query.CountAsync(t => t.Status == TodoStatus.InProgress);
            var done = await query.CountAsync(t => t.Status == TodoStatus.Done);

            var userGroups = await query
                .GroupBy(t => t.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    Total = g.Count(),
                    Completed = g.Count(t => t.Status == TodoStatus.Done)
                })
                .ToListAsync();

            var userStats = new System.Collections.Generic.Dictionary<int, UserTodoStats>();
            foreach (var g in userGroups)
            {
                userStats[g.UserId] = new UserTodoStats
                {
                    TotalTasks = g.Total,
                    CompletedTasks = g.Completed
                };
            }

            return new TodoStatsDto
            {
                TotalTasks = total,
                PendingTasks = pending,
                InProgressTasks = inProgress,
                CompletedTasks = done,
                UserStats = userStats
            };
        }

        public async Task<IEnumerable<string>> GetCategoriesAsync(int userId, UserRole role, int? departmentId)
        {
            var query = _context.Todos.AsQueryable();
            query = ApplyRoleFilter(query, userId, role, departmentId);

            var categories = await query
                .Where(t => !string.IsNullOrEmpty(t.Category))
                .Select(t => t.Category!)
                .Distinct()
                .ToListAsync();

            return categories;
        }

    }
}
