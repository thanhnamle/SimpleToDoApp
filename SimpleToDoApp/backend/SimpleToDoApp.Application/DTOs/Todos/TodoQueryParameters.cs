namespace SimpleToDoApp.Application.DTOs.Todos
{
    
    public class TodoQueryParameters
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 9;
        public string? Search { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public string? Category { get; set; }
        public string? Sort { get; set; }
        public int? DepartmentId { get; set; }
        public DateTime? StartDateFrom { get; set; }
        public DateTime? StartDateTo { get; set; }
    }
}