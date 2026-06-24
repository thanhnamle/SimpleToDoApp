using Microsoft.EntityFrameworkCore;
using SimpleToDoApp.Application.Interfaces;
using SimpleToDoApp.Domain.Entities;
using SimpleToDoApp.Domain.Enums;

namespace SimpleToDoApp.Infrastructure.Data
{
    public class TodoDbContext(DbContextOptions<TodoDbContext> options) : DbContext(options), ITodoDbContext
    {
        public DbSet<Todo> Todos { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<Department> Departments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Todo>(entity =>
            {
                entity.Property(e => e.Priority)
                    .HasConversion<string>()
                    .HasMaxLength(50);

                entity.Property(e => e.Status)
                    .HasConversion<string>()
                    .HasMaxLength(50);
            });

            modelBuilder.Entity<Account>()
                .HasOne(a => a.Department)
                .WithMany(d => d.Accounts)
                .HasForeignKey(a => a.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Todo>()
                .HasOne(t => t.Account)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Seed Departments
            modelBuilder.Entity<Department>().HasData(
                new Department { Id = 1, Name = "IT" },
                new Department { Id = 2, Name = "HR" },
                new Department { Id = 3, Name = "Marketing" },
                new Department { Id = 4, Name = "Sales" },
                new Department { Id = 5, Name = "Finance" }
            );

            // Hash for "Password@123"
            var defaultPasswordHash = "$2a$11$hm8JAwHl9M3D7omt2EM/WxeuMOoxADB4EZ3u7dfGcRQjEIKuryi4/S";
            
            // Seed 1 DepartmentHead
            var seedAccounts = new List<Account>();
            int accountId = 1;

            seedAccounts.Add(new Account
            {
                UserId = accountId++,
                Username = "admin_head",
                Email = "admin@company.com",
                Password = defaultPasswordHash,
                IsEmailVerified = true,
                DepartmentId = null,
                Role = UserRole.DepartmentHead
            });

            // Seed 1 Leader and 1 Employee per department
            for (int deptId = 1; deptId <= 5; deptId++)
            {
                // Leader
                seedAccounts.Add(new Account
                {
                    UserId = accountId++,
                    Username = $"leader_dept{deptId}",
                    Email = $"leader{deptId}@company.com",
                    Password = defaultPasswordHash,
                    IsEmailVerified = true,
                    DepartmentId = deptId,
                    Role = UserRole.Leader
                });
                // Employee
                seedAccounts.Add(new Account
                {
                    UserId = accountId++,
                    Username = $"emp_dept{deptId}",
                    Email = $"emp{deptId}@company.com",
                    Password = defaultPasswordHash,
                    IsEmailVerified = true,
                    DepartmentId = deptId,
                    Role = UserRole.Employee
                });
            }
            modelBuilder.Entity<Account>().HasData(seedAccounts);

            base.OnModelCreating(modelBuilder);

            modelBuilder.HasPostgresExtension("pg_trgm");

            modelBuilder.Entity<Todo>()
                .HasIndex(t => t.Title)
                .HasMethod("gin")
                .HasOperators("gin_trgm_ops");

            modelBuilder.Entity<Todo>()
                .HasIndex(t => t.Description)
                .HasMethod("gin")
                .HasOperators("gin_trgm_ops");

            modelBuilder.Entity<Todo>().HasIndex(t => t.Status);
            modelBuilder.Entity<Todo>().HasIndex(t => t.Priority);
            modelBuilder.Entity<Todo>().HasIndex(t => t.Category);
            modelBuilder.Entity<Todo>().HasIndex(t => t.UserId);

        }
    }
}
