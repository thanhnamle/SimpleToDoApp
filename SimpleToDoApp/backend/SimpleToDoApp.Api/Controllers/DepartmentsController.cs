using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SimpleToDoApp.Application.Interfaces;
using SimpleToDoApp.Domain.Enums;

namespace SimpleToDoApp.Api.Controllers
{
    [ApiController]
    [Route("api/departments")]
    public class DepartmentsController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;

        public DepartmentsController(IDepartmentService departmentService)
        {
            _departmentService = departmentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var depts = await _departmentService.GetAllDepartmentsAsync();
            return Ok(depts);
        }

        [Authorize]
        [HttpGet("members")]
        public async Task<IActionResult> GetMembers()
        {
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            var deptClaim = User.FindFirst("DepartmentId")?.Value;

            if (string.IsNullOrEmpty(roleClaim) || !System.Enum.TryParse<UserRole>(roleClaim, out var role))
            {
                return Forbid();
            }

            if (role == UserRole.Employee)
            {
                return Forbid();
            }

            int? departmentId = null;
            if (!string.IsNullOrEmpty(deptClaim) && int.TryParse(deptClaim, out var parsedDeptId))
            {
                departmentId = parsedDeptId;
            }

            // Leader must have a departmentId
            if (role == UserRole.Leader && !departmentId.HasValue)
            {
                return BadRequest(new { message = "Invalid department info for Leader." });
            }

            var members = await _departmentService.GetDepartmentMembersAsync(departmentId);
            return Ok(members);
        }
    }
}
