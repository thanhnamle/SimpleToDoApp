namespace SimpleToDoApp.Application.DTOs.Auth
{
    public class AuthResponse
    {
        public required string Token { get; set; }
        public DateTime ExpiresAt { get; set; }
        public required UserDto User { get; set; }
    }

    public class UserDto
    {
        public int UserId { get; set; }
        public required string Username { get; set; }
        public required string Email { get; set; }
        public SimpleToDoApp.Domain.Enums.UserRole Role { get; set; }
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
    }
}
