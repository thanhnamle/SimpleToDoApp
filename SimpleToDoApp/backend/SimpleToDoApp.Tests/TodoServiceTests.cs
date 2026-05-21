using Microsoft.EntityFrameworkCore;
using SimpleToDoApp.Application.DTOs.Todos;
using SimpleToDoApp.Application.Services;
using SimpleToDoApp.Domain.Entities;
using SimpleToDoApp.Domain.Enums;
using SimpleToDoApp.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace SimpleToDoApp.Tests
{
    public class TodoServiceTests
    {
        private TodoDbContext CreateDbContext()
        {
            var options = new DbContextOptionsBuilder<TodoDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new TodoDbContext(options);
        }

        [Fact]
        public async Task GetUserTodosAsync_OnlyReturnsUserSpecificTodos()
        {
            // Arrange
            var context = CreateDbContext();
            context.Todos.AddRange(new List<Todo>
            {
                new Todo { Id = 1, Title = "User1 Task", Description = "Desc", IsCompleted = false, Category = "Work", Priority = TodoPriority.High, Status = TodoStatus.Pending, UserId = 1 },
                new Todo { Id = 2, Title = "User2 Task", Description = "Desc", IsCompleted = false, Category = "Personal", Priority = TodoPriority.Low, Status = TodoStatus.Pending, UserId = 2 }
            });
            await context.SaveChangesAsync();

            var service = new TodoService(context);

            // Act
            var todos = (await service.GetUserTodosAsync(1)).ToList();

            // Assert
            Assert.Single(todos);
            Assert.Equal("User1 Task", todos[0].Title);
        }

        [Fact]
        public async Task CreateTodoAsync_ValidInput_SavesAndSynchronizesStatus()
        {
            // Arrange
            var context = CreateDbContext();
            var service = new TodoService(context);

            var request = new CreateTodoRequest
            {
                Title = "Task A",
                Description = "Description",
                Category = "Work",
                Priority = "High",
                Status = "Done", // Status Done should force IsCompleted = true
                StartDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddHours(2)
            };

            // Act
            var result = await service.CreateTodoAsync(request, 1);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Task A", result.Title);
            Assert.True(result.IsCompleted); // Should be synchronized
            Assert.Equal("High", result.Priority);
            Assert.Equal("Done", result.Status);

            var saved = await context.Todos.FindAsync(result.Id);
            Assert.NotNull(saved);
            Assert.True(saved.IsCompleted);
        }

        [Fact]
        public async Task UpdateTodoStatusAsync_ChangeToDone_MarksCompleted()
        {
            // Arrange
            var context = CreateDbContext();
            var todo = new Todo { Id = 1, Title = "Task", Description = "Desc", IsCompleted = false, Category = "Work", Priority = TodoPriority.High, Status = TodoStatus.Pending, UserId = 1 };
            context.Todos.Add(todo);
            await context.SaveChangesAsync();

            var service = new TodoService(context);
            var request = new UpdateTodoStatusRequest { Status = "Done" };

            // Act
            var result = await service.UpdateTodoStatusAsync(1, request, 1);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Done", result.Status);
            Assert.True(result.IsCompleted);

            var saved = await context.Todos.FindAsync(1);
            Assert.True(saved.IsCompleted);
        }

        [Fact]
        public async Task UpdateTodoAsync_UnauthorizedUser_ReturnsNull()
        {
            // Arrange
            var context = CreateDbContext();
            var todo = new Todo { Id = 1, Title = "Task", Description = "Desc", IsCompleted = false, Category = "Work", Priority = TodoPriority.High, Status = TodoStatus.Pending, UserId = 1 };
            context.Todos.Add(todo);
            await context.SaveChangesAsync();

            var service = new TodoService(context);
            var request = new UpdateTodoRequest
            {
                Title = "Updated",
                Description = "Desc",
                IsCompleted = true,
                Category = "Work",
                Priority = "High",
                Status = "InProgress"
            };

            // Act
            var result = await service.UpdateTodoAsync(1, request, 2); // Different User ID

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task DeleteTodoAsync_ValidUser_DeletesTodo()
        {
            // Arrange
            var context = CreateDbContext();
            var todo = new Todo { Id = 1, Title = "Task", Description = "Desc", IsCompleted = false, Category = "Work", Priority = TodoPriority.High, Status = TodoStatus.Pending, UserId = 1 };
            context.Todos.Add(todo);
            await context.SaveChangesAsync();

            var service = new TodoService(context);

            // Act
            var success = await service.DeleteTodoAsync(1, 1);

            // Assert
            Assert.True(success);
            Assert.False(await context.Todos.AnyAsync());
        }
    }
}
