using Microsoft.EntityFrameworkCore;
using SimpleToDoApp.Api.Extensions;
using SimpleToDoApp.Infrastructure;
using SimpleToDoApp.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCustomCors();
builder.Services.AddCustomAuthentication(builder.Configuration);
builder.Services.AddCustomSwagger();

builder.Services.AddDbContext<TodoDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("LocalDbCS")));

builder.Services.AddInfrastructureServices(builder.Configuration);

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

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "ok",
    app = "SimpleToDoApp.Api"
}));

app.MapControllers();

app.Run();
