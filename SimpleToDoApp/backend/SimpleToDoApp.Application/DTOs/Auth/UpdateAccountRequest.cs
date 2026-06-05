using System.ComponentModel.DataAnnotations;
using SimpleToDoApp.Domain.Enums;

namespace SimpleToDoApp.Application.DTOs.Auth
{
    public class UpdateAccountRequest
    {
        [Required]
        public required string Username { get; set; }
        
        [Required]
        [EmailAddress]
        public required string Email { get; set; }
        
        public string? Password { get; set; } // Optional: only update if provided
        
        [Required]
        public UserRole Role { get; set; }
        
        public int? DepartmentId { get; set; }
    }
}
