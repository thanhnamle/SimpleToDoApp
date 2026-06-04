namespace SimpleToDoApp.Application.Settings
{
    public class EmailSettings
    {
        public string Provider { get; set; } = "Gmail"; // "Gmail" | "Outlook"
        public string Host { get; set; } = "smtp.gmail.com";
        public int Port { get; set; } = 587;
        public string SenderEmail { get; set; } = string.Empty;
        public string SenderName { get; set; } = "ZenTodo App";
        public string Password { get; set; } = string.Empty;
        public bool Enabled { get; set; } = false;
    }
}
