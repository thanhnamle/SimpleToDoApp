using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SimpleToDoApp.Application.DTOs.Auth;
using SimpleToDoApp.Application.Interfaces;
using SimpleToDoApp.Domain.Enums;

namespace SimpleToDoApp.Api.Controllers
{
    [ApiController]
    [Route("api/accounts")]
    [Authorize(Roles = "DepartmentHead")]
    public class AccountsController : ControllerBase
    {
        private readonly IAccountService _accountService;

        public AccountsController(IAccountService accountService)
        {
            _accountService = accountService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var accounts = await _accountService.GetAllAccountsAsync();
            return Ok(accounts);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAccountRequest request)
        {
            try
            {
                var account = await _accountService.CreateAccountAsync(request);
                return Created($"/api/accounts/{account.UserId}", account);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the account.", details = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateAccountRequest request)
        {
            try
            {
                var account = await _accountService.UpdateAccountAsync(id, request);
                return Ok(account);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (System.Collections.Generic.KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the account.", details = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var success = await _accountService.DeleteAccountAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Account not found." });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the account.", details = ex.Message });
            }
        }
    }
}
