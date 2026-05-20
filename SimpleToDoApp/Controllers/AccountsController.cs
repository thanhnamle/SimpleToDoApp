using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SimpleToDoApp.Models;

namespace SimpleToDoApp.Controllers
{
    public class AccountsController : Controller
    {
        private readonly TodoDbContext _context;

        public AccountsController(TodoDbContext context)
        {
            _context = context;
        }

        // GET: Accounts/Register
        [HttpGet]
        public IActionResult Register()
        {
            return View("RegisterAccounts");
        }

        // POST: Accounts/Register
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(Register model)
        {
            if (ModelState.IsValid)
            {
                // 1. Check if the email and username already exists
                var emailExists = await _context.Accounts.AnyAsync(a => a.Email == model.Email);
                if (emailExists)
                {
                    ModelState.AddModelError("Email", "This email is already signed.");
                    return View("RegisterAccounts", model);
                }

                var usernameExists = await _context.Accounts.AnyAsync(a => a.Username == model.Username);
                if (usernameExists)
                {
                    ModelState.AddModelError("Username", "This username is already signed.");
                    return View("RegisterAccounts", model);
                }

                // 2. Create a new account
                var account = new Account
                {
                    Username = model.Username,
                    Email = model.Email,
                    Password = model.Password,
                };

                // 3. Add the account to the database
                _context.Accounts.Add(account);
                await _context.SaveChangesAsync();

                TempData["SuccessMessage"] = "Registration successful! You can now log in.";
                return RedirectToAction(nameof(Login));
            }
            return View("RegisterAccounts", model);
        }

        // GET: Accounts/Login
        [HttpGet]
        public IActionResult Login()
        {
            return View("LoginAccounts");
        }

        // POST: Accounts/Login
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(Login model)
        {
            if (ModelState.IsValid)
            {
                // 1. Find the account with Email or Username
                var account = await _context.Accounts
                    .FirstOrDefaultAsync(a => (a.Email == model.UsernameOrEmail || a.Username == model.UsernameOrEmail) && a.Password == model.Password);

                // 2. If account is found, set session and redirect to Todos index
                if (account == null)
                {
                    ModelState.AddModelError(string.Empty, "Invalid login attempt. Please check your credentials.");
                    return View("LoginAccounts", model);
                }
                else
                {
                    HttpContext.Session.SetString("UserId", account.UserId.ToString());
                    HttpContext.Session.SetString("Username", account.Username);

                    return RedirectToAction("Index", "Todos");
                }
            }

            return View("LoginAccounts", model);
        }

        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction(nameof(Login));
        }
    }
}
