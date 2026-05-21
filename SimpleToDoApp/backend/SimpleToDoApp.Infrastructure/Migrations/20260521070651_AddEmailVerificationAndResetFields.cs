using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SimpleToDoApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailVerificationAndResetFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmailVerificationToken",
                table: "Accounts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EmailVerificationTokenExpiry",
                table: "Accounts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsEmailVerified",
                table: "Accounts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PasswordResetToken",
                table: "Accounts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordResetTokenExpiry",
                table: "Accounts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Accounts",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "EmailVerificationToken", "EmailVerificationTokenExpiry", "IsEmailVerified", "PasswordResetToken", "PasswordResetTokenExpiry" },
                values: new object[] { null, null, false, null, null });

            migrationBuilder.UpdateData(
                table: "Accounts",
                keyColumn: "UserId",
                keyValue: 2,
                columns: new[] { "EmailVerificationToken", "EmailVerificationTokenExpiry", "IsEmailVerified", "PasswordResetToken", "PasswordResetTokenExpiry" },
                values: new object[] { null, null, false, null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailVerificationToken",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "EmailVerificationTokenExpiry",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "IsEmailVerified",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "PasswordResetToken",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "PasswordResetTokenExpiry",
                table: "Accounts");
        }
    }
}
