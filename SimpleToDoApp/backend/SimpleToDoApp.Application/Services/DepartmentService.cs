using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SimpleToDoApp.Application.DTOs.Auth;
using SimpleToDoApp.Application.DTOs.Department;
using SimpleToDoApp.Application.Interfaces;

namespace SimpleToDoApp.Application.Services
{
    public class DepartmentService : IDepartmentService
    {
        private readonly ITodoDbContext _context;

        public DepartmentService(ITodoDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<UserDto>> GetDepartmentMembersAsync(int? departmentId)
        {
            var query = _context.Accounts.Include(a => a.Department).AsQueryable();
            if (departmentId.HasValue)
            {
                query = query.Where(a => a.DepartmentId == departmentId.Value);
            }

            var accounts = await query
                .OrderBy(a => a.Username)
                .ToListAsync();

            return accounts.Select(a => new UserDto
            {
                UserId = a.UserId,
                Username = a.Username,
                Email = a.Email,
                Role = a.Role,
                DepartmentId = a.DepartmentId,
                DepartmentName = a.Department?.Name
            });
        }

        public async Task<IEnumerable<DepartmentDto>> GetAllDepartmentsAsync()
        {
            var depts = await _context.Departments
                .OrderBy(d => d.Name)
                .ToListAsync();

            return depts.Select(d => new DepartmentDto
            {
                Id = d.Id,
                Name = d.Name
            });
        }
    }
}
