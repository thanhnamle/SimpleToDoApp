using System.ComponentModel.DataAnnotations;

namespace SimpleToDoApp.Application.DTOs.Auth
{
    public class ResetPasswordRequest
    {
        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        [StringLength(15, MinimumLength = 8)] // Match original password regex/limits if possible
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,15}$", ErrorMessage = "Password must be 8-15 characters long, contain at least one uppercase letter, one lowercase letter, and one number.")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
