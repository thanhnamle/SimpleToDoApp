using System.ComponentModel.DataAnnotations;

namespace SimpleToDoApp.Models
{
    public class Login
    {
        [Required(ErrorMessage = "Email is required.")]
        public required string UsernameOrEmail { get; set; }
        [Required(ErrorMessage = "Password is required.")]
        [DataType(DataType.Password)]
        public required string Password { get; set; }
        public bool RememberMe { get; set; }
    }
}
