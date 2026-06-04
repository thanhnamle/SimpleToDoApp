using System.Collections.Generic;
using System.Threading.Tasks;
using SimpleToDoApp.Application.DTOs.Auth;
using SimpleToDoApp.Application.DTOs.Department;

namespace SimpleToDoApp.Application.Interfaces
{
    public interface IDepartmentService
    {
        Task<IEnumerable<UserDto>> GetDepartmentMembersAsync(int? departmentId);
        Task<IEnumerable<DepartmentDto>> GetAllDepartmentsAsync();
    }
}
