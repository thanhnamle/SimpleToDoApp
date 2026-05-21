using System.ComponentModel.DataAnnotations;

namespace SimpleToDoApp.Application.DTOs.Auth
{
    public class RegisterRequest
    {
        [Required]
        [StringLength(255)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(15, MinimumLength = 8)]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,15}$",
            ErrorMessage = "Password must be 8-15 characters long, contain at least one uppercase letter, one lowercase letter, and one number.")]
        public string Password { get; set; } = string.Empty;
    }
}
