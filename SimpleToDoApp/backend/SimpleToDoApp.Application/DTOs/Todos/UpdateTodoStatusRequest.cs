using System.ComponentModel.DataAnnotations;

namespace SimpleToDoApp.Application.DTOs.Todos
{
    public class UpdateTodoStatusRequest
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }
}
