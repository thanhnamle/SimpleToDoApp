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
                Password = NormalizePassword(
                    configuration["EmailSettings:Provider"] ?? "Gmail",
                    configuration["EmailSettings:Password"] ?? ""),
                Enabled = bool.TryParse(configuration["EmailSettings:Enabled"], out var enabled) && enabled
            };
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            if (!_emailSettings.Enabled ||
                string.IsNullOrWhiteSpace(_emailSettings.SenderEmail) || 
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
                using var message = new MailMessage
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
                    client.DeliveryMethod = SmtpDeliveryMethod.Network;
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

        private static string NormalizePassword(string provider, string password)
        {
            var normalized = password.Trim();

            if (provider.Equals("Gmail", StringComparison.OrdinalIgnoreCase))
            {
                normalized = normalized.Replace(" ", string.Empty);
            }

            return normalized;
        }
    }
}
