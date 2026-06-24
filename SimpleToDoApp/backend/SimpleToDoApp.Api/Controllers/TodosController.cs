using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SimpleToDoApp.Application.DTOs.Todos;
using SimpleToDoApp.Application.Interfaces;

namespace SimpleToDoApp.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/todos")]
    public class TodosController : ControllerBase
    {
        private readonly ITodoService _todoService;

        public TodosController(ITodoService todoService)
        {
            _todoService = todoService;
        }

        private (int UserId, SimpleToDoApp.Domain.Enums.UserRole Role, int? DepartmentId)? GetUserContext()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            var deptClaim = User.FindFirst("DepartmentId")?.Value;

            if (int.TryParse(userIdClaim, out var userId) &&
                Enum.TryParse<SimpleToDoApp.Domain.Enums.UserRole>(roleClaim, out var role))
            {
                int? deptId = null;
                if (int.TryParse(deptClaim, out var parsedDeptId))
                {
                    deptId = parsedDeptId;
                }
                return (userId, role, deptId);
            }
            return null;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery]TodoQueryParameters parameters)
        {
            var ctx = GetUserContext();
            if (ctx == null) return Unauthorized(new { message = "Unauthorized access." });

            var todos = await _todoService.GetUserTodosAsync(parameters, ctx.Value.UserId, ctx.Value.Role, ctx.Value.DepartmentId);
            return Ok(todos);
        }

        [HttpGet("calendar")]
        public async Task<IActionResult> GetCalendar()
        {
            var ctx = GetUserContext();
            if (ctx == null) return Unauthorized(new { message = "Unauthorized access." });

            var todos = await _todoService.GetUserCalendarTodosAsync(ctx.Value.UserId, ctx.Value.Role, ctx.Value.DepartmentId);
            return Ok(todos);
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var ctx = GetUserContext();
            if (ctx == null) return Unauthorized(new { message = "Unauthorized access." });

            var stats = await _todoService.GetTodoStatsAsync(ctx.Value.UserId, ctx.Value.Role, ctx.Value.DepartmentId);
            return Ok(stats);
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var ctx = GetUserContext();
            if (ctx == null) return Unauthorized(new { message = "Unauthorized access." });

            var categories = await _todoService.GetCategoriesAsync(ctx.Value.UserId, ctx.Value.Role, ctx.Value.DepartmentId);
            return Ok(categories);
        }


        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var ctx = GetUserContext();
            if (ctx == null) return Unauthorized(new { message = "Unauthorized access." });

            var todo = await _todoService.GetTodoByIdAsync(id, ctx.Value.UserId, ctx.Value.Role, ctx.Value.DepartmentId);
            if (todo == null)
            {
                return NotFound(new { message = $"Todo with ID {id} not found." });
            }

            return Ok(todo);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTodoRequest request)
        {
            var ctx = GetUserContext();
            if (ctx == null) return Unauthorized(new { message = "Unauthorized access." });

            try
            {
                var todo = await _todoService.CreateTodoAsync(request, ctx.Value.UserId, ctx.Value.Role, ctx.Value.DepartmentId);
                return CreatedAtAction(nameof(GetById), new { id = todo.Id }, todo);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred.", details = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateTodoRequest request)
        {
            var ctx = GetUserContext();
            if (ctx == null) return Unauthorized(new { message = "Unauthorized access." });

            try
            {
                var todo = await _todoService.UpdateTodoAsync(id, request, ctx.Value.UserId, ctx.Value.Role, ctx.Value.DepartmentId);
                if (todo == null)
                {
                    return NotFound(new { message = $"Todo with ID {id} not found." });
                }

                return Ok(todo);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception)
            {
                throw;
            }
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTodoStatusRequest request)
        {
            var ctx = GetUserContext();
            if (ctx == null) return Unauthorized(new { message = "Unauthorized access." });

            try
            {
                var todo = await _todoService.UpdateTodoStatusAsync(id, request, ctx.Value.UserId, ctx.Value.Role, ctx.Value.DepartmentId);
                if (todo == null)
                {
                    return NotFound(new { message = $"Todo with ID {id} not found." });
                }

                return Ok(todo);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred.", details = ex.Message });
            }
        }

        [HttpPost("seed")]
        public async Task<IActionResult> SeedTasks()
        {
            var ctx = GetUserContext();
            if (ctx == null) return Unauthorized(new { message = "Unauthorized access." });

            await _todoService.SeedTasksAsync(ctx.Value.UserId, ctx.Value.DepartmentId);
            return Ok(new { message = "Successfully generated 50 sample tasks." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ctx = GetUserContext();
            if (ctx == null) return Unauthorized(new { message = "Unauthorized access." });

            var success = await _todoService.DeleteTodoAsync(id, ctx.Value.UserId, ctx.Value.Role, ctx.Value.DepartmentId);
            if (!success)
            {
                return NotFound(new { message = $"Todo with ID {id} not found." });
            }

            return NoContent();
        }
    }
}
