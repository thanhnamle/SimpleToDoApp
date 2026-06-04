using System.Threading.Tasks;

namespace SimpleToDoApp.Application.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string htmlBody);
    }
}
