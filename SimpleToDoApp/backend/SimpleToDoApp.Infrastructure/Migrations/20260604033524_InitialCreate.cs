using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SimpleToDoApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Accounts",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Username = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Password = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsEmailVerified = table.Column<bool>(type: "bit", nullable: false),
                    EmailVerificationToken = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EmailVerificationTokenExpiry = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PasswordResetToken = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PasswordResetTokenExpiry = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DepartmentId = table.Column<int>(type: "int", nullable: true),
                    Role = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accounts", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_Accounts_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Todos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsAllDay = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReminderMinutes = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Todos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Todos_Accounts_UserId",
                        column: x => x.UserId,
                        principalTable: "Accounts",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Accounts",
                columns: new[] { "UserId", "DepartmentId", "Email", "EmailVerificationToken", "EmailVerificationTokenExpiry", "IsEmailVerified", "Password", "PasswordResetToken", "PasswordResetTokenExpiry", "Role", "Username" },
                values: new object[] { 1, null, "admin@company.com", null, null, true, "$2a$11$hm8JAwHl9M3D7omt2EM/PebH.cKJHZSUAqxAdCv/ILOTvYA25tbwe", null, null, 2, "admin_head" });

            migrationBuilder.InsertData(
                table: "Departments",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "IT" },
                    { 2, "HR" },
                    { 3, "Marketing" },
                    { 4, "Sales" },
                    { 5, "Finance" }
                });

            migrationBuilder.InsertData(
                table: "Accounts",
                columns: new[] { "UserId", "DepartmentId", "Email", "EmailVerificationToken", "EmailVerificationTokenExpiry", "IsEmailVerified", "Password", "PasswordResetToken", "PasswordResetTokenExpiry", "Role", "Username" },
                values: new object[,]
                {
                    { 2, 1, "leader1@company.com", null, null, true, "$2a$11$hm8JAwHl9M3D7omt2EM/PebH.cKJHZSUAqxAdCv/ILOTvYA25tbwe", null, null, 1, "leader_dept1" },
                    { 3, 1, "emp1@company.com", null, null, true, "$2a$11$hm8JAwHl9M3D7omt2EM/PebH.cKJHZSUAqxAdCv/ILOTvYA25tbwe", null, null, 0, "emp_dept1" },
                    { 4, 2, "leader2@company.com", null, null, true, "$2a$11$hm8JAwHl9M3D7omt2EM/PebH.cKJHZSUAqxAdCv/ILOTvYA25tbwe", null, null, 1, "leader_dept2" },
                    { 5, 2, "emp2@company.com", null, null, true, "$2a$11$hm8JAwHl9M3D7omt2EM/PebH.cKJHZSUAqxAdCv/ILOTvYA25tbwe", null, null, 0, "emp_dept2" },
                    { 6, 3, "leader3@company.com", null, null, true, "$2a$11$hm8JAwHl9M3D7omt2EM/PebH.cKJHZSUAqxAdCv/ILOTvYA25tbwe", null, null, 1, "leader_dept3" },
                    { 7, 3, "emp3@company.com", null, null, true, "$2a$11$hm8JAwHl9M3D7omt2EM/PebH.cKJHZSUAqxAdCv/ILOTvYA25tbwe", null, null, 0, "emp_dept3" },
                    { 8, 4, "leader4@company.com", null, null, true, "$2a$11$hm8JAwHl9M3D7omt2EM/PebH.cKJHZSUAqxAdCv/ILOTvYA25tbwe", null, null, 1, "leader_dept4" },
                    { 9, 4, "emp4@company.com", null, null, true, "$2a$11$hm8JAwHl9M3D7omt2EM/PebH.cKJHZSUAqxAdCv/ILOTvYA25tbwe", null, null, 0, "emp_dept4" },
                    { 10, 5, "leader5@company.com", null, null, true, "$2a$11$hm8JAwHl9M3D7omt2EM/PebH.cKJHZSUAqxAdCv/ILOTvYA25tbwe", null, null, 1, "leader_dept5" },
                    { 11, 5, "emp5@company.com", null, null, true, "$2a$11$hm8JAwHl9M3D7omt2EM/PebH.cKJHZSUAqxAdCv/ILOTvYA25tbwe", null, null, 0, "emp_dept5" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_DepartmentId",
                table: "Accounts",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Todos_UserId",
                table: "Todos",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Todos");

            migrationBuilder.DropTable(
                name: "Accounts");

            migrationBuilder.DropTable(
                name: "Departments");
        }
    }
}
