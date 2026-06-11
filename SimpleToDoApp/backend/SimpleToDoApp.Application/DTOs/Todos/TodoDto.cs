using System;

namespace SimpleToDoApp.Application.DTOs.Todos
{
    public class TodoDto
    {
        public int Id { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public bool IsCompleted { get; set; }
        public required string Category { get; set; }
        public required string Priority { get; set; }
        public required string Status { get; set; }
        public bool IsAllDay { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime DueDate { get; set; }
        public int ReminderMinutes { get; set; }

        public int AssignedUserId { get; set; }
        public string? AssignedUsername { get; set; }
        public string? AssignedEmail { get; set; }
        public int? DepartmentId { get; set; }
    }
}
