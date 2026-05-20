using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SimpleToDoApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTodoModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Todos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Priority",
                table: "Todos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Todos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Todos",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Category", "Priority", "Status" },
                values: new object[] { "Work", "High", "Pending" });

            migrationBuilder.UpdateData(
                table: "Todos",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Category", "Priority", "Status" },
                values: new object[] { "Personal", "Medium", "Pending" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Todos");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "Todos");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Todos");
        }
    }
}
