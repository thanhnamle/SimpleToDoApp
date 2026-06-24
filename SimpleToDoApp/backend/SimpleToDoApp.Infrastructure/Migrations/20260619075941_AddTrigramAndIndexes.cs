using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SimpleToDoApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTrigramAndIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:pg_trgm", ",,");

            migrationBuilder.CreateIndex(
                name: "IX_Todos_Category",
                table: "Todos",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Todos_Description",
                table: "Todos",
                column: "Description")
                .Annotation("Npgsql:IndexMethod", "gin")
                .Annotation("Npgsql:IndexOperators", new[] { "gin_trgm_ops" });

            migrationBuilder.CreateIndex(
                name: "IX_Todos_Priority",
                table: "Todos",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_Todos_Status",
                table: "Todos",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Todos_Title",
                table: "Todos",
                column: "Title")
                .Annotation("Npgsql:IndexMethod", "gin")
                .Annotation("Npgsql:IndexOperators", new[] { "gin_trgm_ops" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Todos_Category",
                table: "Todos");

            migrationBuilder.DropIndex(
                name: "IX_Todos_Description",
                table: "Todos");

            migrationBuilder.DropIndex(
                name: "IX_Todos_Priority",
                table: "Todos");

            migrationBuilder.DropIndex(
                name: "IX_Todos_Status",
                table: "Todos");

            migrationBuilder.DropIndex(
                name: "IX_Todos_Title",
                table: "Todos");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:PostgresExtension:pg_trgm", ",,");
        }
    }
}
