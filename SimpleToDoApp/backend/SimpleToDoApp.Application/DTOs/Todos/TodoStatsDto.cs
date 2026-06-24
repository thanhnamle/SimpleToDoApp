namespace SimpleToDoApp.Application.DTOs.Todos
{
    public class TodoStatsDto
    {
        public int TotalTasks { get; set; }
        public int PendingTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int CompletedTasks { get; set; }
        public System.Collections.Generic.Dictionary<int, UserTodoStats> UserStats { get; set; } = new();
    }

    public class UserTodoStats
    {
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
    }
}
