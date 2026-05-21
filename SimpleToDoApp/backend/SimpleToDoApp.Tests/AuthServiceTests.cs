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
        public async Task RegisterAsync_ValidRequest_RegistersUser()
        {
            // Arrange
            var context = CreateDbContext();
            var mockHasher = new Mock<IPasswordHasher>();
            mockHasher.Setup(h => h.HashPassword(It.IsAny<string>())).Returns("hashed_pwd");

            var mockJwt = new Mock<IJwtTokenService>();
            mockJwt.Setup(j => j.GenerateToken(It.IsAny<Account>())).Returns(("fake_token", DateTime.UtcNow.AddDays(1)));

            var authService = new AuthService(context, mockHasher.Object, mockJwt.Object);

            var request = new RegisterRequest
            {
                Username = "newuser",
                Email = "new@test.com",
                Password = "Password123"
            };

            // Act
            var response = await authService.RegisterAsync(request);

            // Assert
            Assert.NotNull(response);
            Assert.Equal("newuser", response.User.Username);
            Assert.Equal("fake_token", response.Token);
            Assert.True(await context.Accounts.AnyAsync(a => a.Username == "newuser"));
        }

        [Fact]
        public async Task RegisterAsync_DuplicateUsername_ThrowsArgumentException()
        {
            // Arrange
            var context = CreateDbContext();
            context.Accounts.Add(new Account { UserId = 1, Username = "existing", Email = "old@test.com", Password = "pwd" });
            await context.SaveChangesAsync();

            var authService = new AuthService(context, new Mock<IPasswordHasher>().Object, new Mock<IJwtTokenService>().Object);

            var request = new RegisterRequest
            {
                Username = "existing",
                Email = "new@test.com",
                Password = "Password123"
            };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => authService.RegisterAsync(request));
        }

        [Fact]
        public async Task LoginAsync_ValidCredentials_ReturnsToken()
        {
            // Arrange
            var context = CreateDbContext();
            context.Accounts.Add(new Account { UserId = 1, Username = "user", Email = "user@test.com", Password = "hashed_password" });
            await context.SaveChangesAsync();

            var mockHasher = new Mock<IPasswordHasher>();
            mockHasher.Setup(h => h.VerifyPassword("plain_password", "hashed_password")).Returns(true);

            var mockJwt = new Mock<IJwtTokenService>();
            mockJwt.Setup(j => j.GenerateToken(It.IsAny<Account>())).Returns(("valid_jwt", DateTime.UtcNow.AddDays(1)));

            var authService = new AuthService(context, mockHasher.Object, mockJwt.Object);

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
            context.Accounts.Add(new Account { UserId = 1, Username = "user", Email = "user@test.com", Password = "hashed_password" });
            await context.SaveChangesAsync();

            var mockHasher = new Mock<IPasswordHasher>();
            mockHasher.Setup(h => h.VerifyPassword("wrong_password", "hashed_password")).Returns(false);

            var authService = new AuthService(context, mockHasher.Object, new Mock<IJwtTokenService>().Object);

            var request = new LoginRequest
            {
                UsernameOrEmail = "user",
                Password = "wrong_password"
            };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => authService.LoginAsync(request));
        }
    }
}
