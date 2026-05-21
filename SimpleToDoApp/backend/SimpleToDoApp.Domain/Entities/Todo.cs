using System.ComponentModel.DataAnnotations;
using SimpleToDoApp.Domain.Enums;

namespace SimpleToDoApp.Domain.Entities
{
    public class Todo
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public required string Title { get; set; }

        [Required]
        [StringLength(256)]
        public required string Description { get; set; }

        [Required]
        [Display(Name = "Have you completed this task?")]
        public bool IsCompleted { get; set; }

        [Required]
        [Display(Name = "Category")]
        public required string Category { get; set; }

        [Required]
        [Display(Name = "Priority")]
        public TodoPriority Priority { get; set; }

        [Required]
        [Display(Name = "Status")]
        public TodoStatus Status { get; set; }

        [Required]
        public bool IsAllDay { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [Required]
        [Display(Name = "Start Time")]
        public DateTime StartDate { get; set; }

        [Required]
        [Display(Name = "End Time")]
        public DateTime DueDate { get; set; }

        [Required]
        [Display(Name = "Reminder (minutes before)")]
        public int ReminderMinutes { get; set; }

        [Required]
        public int UserId { get; set; }
    }
}
