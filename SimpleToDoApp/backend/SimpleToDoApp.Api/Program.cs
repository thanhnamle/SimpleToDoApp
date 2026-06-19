using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using SimpleToDoApp.Api.Extensions;
using SimpleToDoApp.Infrastructure;
using SimpleToDoApp.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddCustomCors();
builder.Services.AddCustomAuthentication(builder.Configuration);
builder.Services.AddCustomSwagger();
builder.Services.AddSignalR();

builder.Services.AddDbContext<TodoDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddInfrastructureServices(builder.Configuration);

builder.Services.AddScoped<SimpleToDoApp.Application.Interfaces.ITodoNotificationService, SimpleToDoApp.Api.Services.TodoNotificationService>();

builder.Services.AddAntiforgery(options => 
{
    options.HeaderName = "X-XSRF-TOKEN";
    options.Cookie.Name = "XSRF-TOKEN";
    options.Cookie.HttpOnly = false;
});

var app = builder.Build();

// Enable Swagger for development and testing
if (app.Environment.IsDevelopment() || true) // Allow Swagger always for testing convenience
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SimpleToDoApp API v1");
        c.RoutePrefix = "swagger";
    });
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors(policy =>
{
    policy.WithOrigins("http://localhost:4200", "https://simpletodoapp.enterprise.com")
          .AllowAnyHeader()
          .AllowAnyMethod()
          .AllowCredentials();
});

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "ok",
    app = "SimpleToDoApp.Api"
}));

app.MapControllers();
app.MapHub<SimpleToDoApp.Api.Hubs.TodoHub>("/hubs/todo");

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<TodoDbContext>();
    // Ensure the database is created
    context.Database.EnsureCreated();

    // Check if the default admin exists
    if (!context.Accounts.Any(a => a.Email == "admin@company.com"))
    {
        var admin = new SimpleToDoApp.Domain.Entities.Account
        {
            Username = "admin_head",
            Email = "admin@company.com",
            Password = "$2a$11$hm8JAwHl9M3D7omt2EM/WxeuMOoxADB4EZ3u7dfGcRQjEIKuryi4/S",
            Role = SimpleToDoApp.Domain.Enums.UserRole.DepartmentHead,
            IsEmailVerified = true
        };
        context.Accounts.Add(admin);
        context.SaveChanges();
    }
}

app.Run();
