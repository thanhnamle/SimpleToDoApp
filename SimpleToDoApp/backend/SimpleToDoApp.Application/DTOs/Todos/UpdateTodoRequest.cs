using System;
using System.ComponentModel.DataAnnotations;

namespace SimpleToDoApp.Application.DTOs.Todos
{
    public class UpdateTodoRequest
    {
        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(256)]
        public string Description { get; set; } = string.Empty;

        public bool IsCompleted { get; set; }

        [Required]
        public string Category { get; set; } = string.Empty;

        [Required]
        public string Priority { get; set; } = "Medium";

        [Required]
        public string Status { get; set; } = "Pending";

        public bool IsAllDay { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime DueDate { get; set; }

        public int ReminderMinutes { get; set; }

        public int? AssignedUserId { get; set; }
    }
}
