using System.ComponentModel.DataAnnotations;

namespace SimpleToDoApp.Models
{
    public class Register
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(150)]
        public required string Username { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(1024)]
        public required string Email { get; set; }

        [Required]
        [StringLength(1024)]
        public required string Password { get; set; }
        
        [Required]
        [Compare("Password", ErrorMessage = "Passwords do not match.")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
