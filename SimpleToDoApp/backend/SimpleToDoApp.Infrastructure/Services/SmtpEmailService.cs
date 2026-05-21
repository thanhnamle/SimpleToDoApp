using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using SimpleToDoApp.Application.Interfaces;
using SimpleToDoApp.Application.Settings;

namespace SimpleToDoApp.Infrastructure.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;

        public SmtpEmailService(IConfiguration configuration)
        {
            _emailSettings = new EmailSettings
            {
                Provider = configuration["EmailSettings:Provider"] ?? "Gmail",
                Host = configuration["EmailSettings:Host"] ?? "smtp.gmail.com",
                Port = int.TryParse(configuration["EmailSettings:Port"], out var port) ? port : 587,
                SenderEmail = configuration["EmailSettings:SenderEmail"] ?? "",
                SenderName = configuration["EmailSettings:SenderName"] ?? "ZenTodo App",
                Password = configuration["EmailSettings:Password"] ?? ""
            };
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            if (string.IsNullOrWhiteSpace(_emailSettings.SenderEmail) || 
                string.IsNullOrWhiteSpace(_emailSettings.Password) ||
                _emailSettings.SenderEmail == "YOUR_EMAIL@gmail.com")
            {
                Console.WriteLine("=========================================================================");
                Console.WriteLine($"[EMAIL SIMULATION] SMTP is not configured. Logging email instead.");
                Console.WriteLine($"To: {toEmail}");
                Console.WriteLine($"Subject: {subject}");
                Console.WriteLine($"Body: {htmlBody}");
                Console.WriteLine("=========================================================================");
                return;
            }

            try
            {
                var message = new MailMessage
                {
                    From = new MailAddress(_emailSettings.SenderEmail, _emailSettings.SenderName),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true
                };
                message.To.Add(new MailAddress(toEmail));

                using (var client = new SmtpClient(_emailSettings.Host, _emailSettings.Port))
                {
                    client.EnableSsl = true;
                    client.UseDefaultCredentials = false;
                    client.Credentials = new NetworkCredential(_emailSettings.SenderEmail, _emailSettings.Password);

                    await client.SendMailAsync(message);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("=========================================================================");
                Console.WriteLine($"[EMAIL ERROR] Failed to send email via SMTP to {toEmail}: {ex.Message}");
                Console.WriteLine($"Subject: {subject}");
                Console.WriteLine($"Body: {htmlBody}");
                Console.WriteLine("=========================================================================");
                throw;
            }
        }
    }
}
