using Microsoft.EntityFrameworkCore;
using SimpleToDoApp.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace SimpleToDoApp.Application.Interfaces
{
    public interface ITodoDbContext
    {
        DbSet<Todo> Todos { get; }
        DbSet<Account> Accounts { get; }
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
