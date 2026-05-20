using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SimpleToDoApp.Domain.Entities
{
    public class Account
    {
        [Key]
        [ForeignKey("UserId")]
        public int UserId { get; set; }

        [Required]
        [MaxLength(255)]
        public required string Username { get; set; }

        [Required]
        [RegularExpression(@"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}")]
        [MaxLength(255)]
        public required string Email { get; set; }

        [Required]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,15}$")]
        public required string Password { get; set; }

    }
}
