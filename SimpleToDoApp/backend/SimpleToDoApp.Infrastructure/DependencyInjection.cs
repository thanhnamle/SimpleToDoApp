using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SimpleToDoApp.Application.Interfaces;
using SimpleToDoApp.Application.Services;
using SimpleToDoApp.Infrastructure.Data;
using SimpleToDoApp.Infrastructure.Security;
using SimpleToDoApp.Infrastructure.Services;

namespace SimpleToDoApp.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped<IEmailService, SmtpEmailService>();

            services.AddScoped<IPasswordHasher, PasswordHasher>();
            services.AddScoped<IJwtTokenService, JwtTokenService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IAccountService, AccountService>();
            services.AddScoped<ITodoService, TodoService>();
            services.AddScoped<IDepartmentService, DepartmentService>();
            services.AddScoped<ITodoDbContext>(provider => provider.GetRequiredService<TodoDbContext>());

            return services;
        }
    }
}
