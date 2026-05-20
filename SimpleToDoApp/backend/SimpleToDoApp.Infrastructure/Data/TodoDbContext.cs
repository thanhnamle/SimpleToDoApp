using Microsoft.EntityFrameworkCore;
using SimpleToDoApp.Domain.Entities;

namespace SimpleToDoApp.Infrastructure.Data
{
    public class TodoDbContext(DbContextOptions<TodoDbContext> options) : DbContext(options)
    {
        public DbSet<Todo> Todos { get; set; }
        public DbSet<Account> Accounts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Todo>().HasData(
                new Todo { Id = 1, Title = "Sample Tasks", Description = "This is a sample task.", IsCompleted = false, Category = "Work", Priority = "High", Status = "Pending", StartDate = new DateTime(2026, 1, 1, 9, 0, 0), DueDate = new DateTime(2026, 1, 1, 10, 0, 0), CreatedAt = new DateTime(2026, 1, 1), UserId = 1 },
                new Todo { Id = 2, Title = "Another Task", Description = "This is another sample task.", IsCompleted = false, Category = "Personal", Priority = "Medium", Status = "Pending", StartDate = new DateTime(2026, 1, 1, 14, 0, 0), DueDate = new DateTime(2026, 1, 1, 15, 0, 0), CreatedAt = new DateTime(2026, 1, 1), UserId = 1 }
            );

            modelBuilder.Entity<Account>().HasData(
                new Account { UserId = 1, Username = "testuser", Email = "testuser@example.com", Password = "123123" },
                new Account { UserId = 2, Username = "thanhnam", Email = "nam@test.com", Password = "123123" }
            );
        }
    }
}
