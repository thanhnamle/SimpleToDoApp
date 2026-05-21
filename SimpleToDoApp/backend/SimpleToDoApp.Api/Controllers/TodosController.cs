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

        private int? GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized(new { message = "Unauthorized access." });

            var todos = await _todoService.GetUserTodosAsync(userId.Value);
            return Ok(todos);
        }

        [HttpGet("calendar")]
        public async Task<IActionResult> GetCalendar()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized(new { message = "Unauthorized access." });

            var todos = await _todoService.GetUserCalendarTodosAsync(userId.Value);
            return Ok(todos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized(new { message = "Unauthorized access." });

            var todo = await _todoService.GetTodoByIdAsync(id, userId.Value);
            if (todo == null)
            {
                return NotFound(new { message = $"Todo with ID {id} not found." });
            }

            return Ok(todo);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTodoRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized(new { message = "Unauthorized access." });

            try
            {
                var todo = await _todoService.CreateTodoAsync(request, userId.Value);
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
            var userId = GetUserId();
            if (userId == null) return Unauthorized(new { message = "Unauthorized access." });

            try
            {
                var todo = await _todoService.UpdateTodoAsync(id, request, userId.Value);
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

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTodoStatusRequest request)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized(new { message = "Unauthorized access." });

            try
            {
                var todo = await _todoService.UpdateTodoStatusAsync(id, request, userId.Value);
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

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized(new { message = "Unauthorized access." });

            var success = await _todoService.DeleteTodoAsync(id, userId.Value);
            if (!success)
            {
                return NotFound(new { message = $"Todo with ID {id} not found." });
            }

            return NoContent();
        }
    }
}
