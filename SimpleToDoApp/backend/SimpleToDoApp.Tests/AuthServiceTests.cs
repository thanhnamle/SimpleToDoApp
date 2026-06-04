using Microsoft.EntityFrameworkCore;
using Moq;
using SimpleToDoApp.Application.DTOs.Auth;
using SimpleToDoApp.Application.Interfaces;
using SimpleToDoApp.Application.Services;
using SimpleToDoApp.Domain.Entities;
using SimpleToDoApp.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace SimpleToDoApp.Tests
{
    public class AuthServiceTests
    {
        private TodoDbContext CreateDbContext()
        {
            var options = new DbContextOptionsBuilder<TodoDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new TodoDbContext(options);
        }

        [Fact]
        public void VerifySeededPasswordHash()
        {
            var hash = "$2a$11$hm8JAwHl9M3D7omt2EM/PebH.cKJHZSUAqxAdCv/ILOTvYA25tbwe";
            var matches = BCrypt.Net.BCrypt.Verify("Password@123", hash);
            Assert.True(matches);
        }

        [Fact]
        public async Task RegisterAsync_ValidRequest_RegistersUser()
        {
            // Arrange
            var context = CreateDbContext();
            var mockHasher = new Mock<IPasswordHasher>();
            mockHasher.Setup(h => h.HashPassword(It.IsAny<string>())).Returns("hashed_pwd");

            var mockJwt = new Mock<IJwtTokenService>();
            mockJwt.Setup(j => j.GenerateToken(It.IsAny<Account>())).Returns(("fake_token", DateTime.UtcNow.AddDays(1)));

            var mockEmail = new Mock<IEmailService>();
            mockEmail.Setup(e => e.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).Returns(Task.CompletedTask);

            var authService = new AuthService(context, mockHasher.Object, mockJwt.Object, mockEmail.Object);

            var request = new RegisterRequest
            {
                Username = "newuser",
                Email = "new@test.com",
                Password = "Password123"
            };

            // Act
            var response = await authService.RegisterAsync(request, "http://localhost:4200");

            // Assert
            Assert.NotNull(response);
            Assert.Equal("newuser", response.User.Username);
            Assert.Equal(string.Empty, response.Token); // Token should be empty on registration until verified
            Assert.True(await context.Accounts.AnyAsync(a => a.Username == "newuser"));
            mockEmail.Verify(e => e.SendEmailAsync("new@test.com", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task RegisterAsync_DuplicateUsername_ThrowsArgumentException()
        {
            // Arrange
            var context = CreateDbContext();
            context.Accounts.Add(new Account { UserId = 1, Username = "existing", Email = "old@test.com", Password = "pwd" });
            await context.SaveChangesAsync();

            var mockEmail = new Mock<IEmailService>();
            var authService = new AuthService(context, new Mock<IPasswordHasher>().Object, new Mock<IJwtTokenService>().Object, mockEmail.Object);

            var request = new RegisterRequest
            {
                Username = "existing",
                Email = "new@test.com",
                Password = "Password123"
            };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => authService.RegisterAsync(request, "http://localhost:4200"));
        }

        [Fact]
        public async Task LoginAsync_ValidCredentials_ReturnsToken()
        {
            // Arrange
            var context = CreateDbContext();
            context.Accounts.Add(new Account { UserId = 1, Username = "user", Email = "user@test.com", Password = "hashed_password", IsEmailVerified = true });
            await context.SaveChangesAsync();

            var mockHasher = new Mock<IPasswordHasher>();
            mockHasher.Setup(h => h.VerifyPassword("plain_password", "hashed_password")).Returns(true);

            var mockJwt = new Mock<IJwtTokenService>();
            mockJwt.Setup(j => j.GenerateToken(It.IsAny<Account>())).Returns(("valid_jwt", DateTime.UtcNow.AddDays(1)));

            var mockEmail = new Mock<IEmailService>();
            var authService = new AuthService(context, mockHasher.Object, mockJwt.Object, mockEmail.Object);

            var request = new LoginRequest
            {
                UsernameOrEmail = "user",
                Password = "plain_password"
            };

            // Act
            var response = await authService.LoginAsync(request);

            // Assert
            Assert.NotNull(response);
            Assert.Equal("valid_jwt", response.Token);
        }

        [Fact]
        public async Task LoginAsync_InvalidCredentials_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var context = CreateDbContext();
            context.Accounts.Add(new Account { UserId = 1, Username = "user", Email = "user@test.com", Password = "hashed_password", IsEmailVerified = true });
            await context.SaveChangesAsync();

            var mockHasher = new Mock<IPasswordHasher>();
            mockHasher.Setup(h => h.VerifyPassword("wrong_password", "hashed_password")).Returns(false);

            var mockEmail = new Mock<IEmailService>();
            var authService = new AuthService(context, mockHasher.Object, new Mock<IJwtTokenService>().Object, mockEmail.Object);

            var request = new LoginRequest
            {
                UsernameOrEmail = "user",
                Password = "wrong_password"
            };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => authService.LoginAsync(request));
        }

        [Fact]
        public async Task LoginAsync_UnverifiedEmail_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var context = CreateDbContext();
            context.Accounts.Add(new Account { UserId = 1, Username = "user", Email = "user@test.com", Password = "hashed_password", IsEmailVerified = false });
            await context.SaveChangesAsync();

            var mockHasher = new Mock<IPasswordHasher>();
            mockHasher.Setup(h => h.VerifyPassword("plain_password", "hashed_password")).Returns(true);

            var mockEmail = new Mock<IEmailService>();
            var authService = new AuthService(context, mockHasher.Object, new Mock<IJwtTokenService>().Object, mockEmail.Object);

            var request = new LoginRequest
            {
                UsernameOrEmail = "user",
                Password = "plain_password"
            };

            // Act & Assert
            var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() => authService.LoginAsync(request));
            Assert.Equal("Please verify your email before logging in.", ex.Message);
        }
    }
}
