using Microsoft.Extensions.DependencyInjection;

namespace SimpleToDoApp.Api.Extensions
{
    public static class CorsExtensions
    {
        public static IServiceCollection AddCustomCors(this IServiceCollection services)
        {
            services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", builder =>
                {
                    builder.SetIsOriginAllowed(origin => true) // Allow any origin
                           .AllowAnyMethod()
                           .AllowAnyHeader()
                           .AllowCredentials(); // SignalR needs credentials
                });
            });

            return services;
        }
    }
}
