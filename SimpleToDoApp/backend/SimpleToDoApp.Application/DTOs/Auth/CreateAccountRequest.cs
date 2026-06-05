using System.ComponentModel.DataAnnotations;
using SimpleToDoApp.Domain.Enums;

namespace SimpleToDoApp.Application.DTOs.Auth
{
    public class CreateAccountRequest
    {
        [Required]
        public required string Username { get; set; }
        
        [Required]
        [EmailAddress]
        public required string Email { get; set; }
        
        [Required]
        [MinLength(6)]
        public required string Password { get; set; }
        
        [Required]
        public UserRole Role { get; set; }
        
        public int? DepartmentId { get; set; }
    }
}
