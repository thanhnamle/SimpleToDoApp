using Microsoft.EntityFrameworkCore;
using SimpleToDoApp.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDbContext<TodoDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("LocalDbCS")));

var app = builder.Build();

app.UseHttpsRedirection();

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "ok",
    app = "SimpleToDoApp.Api"
}));

app.MapControllers();

app.Run();
