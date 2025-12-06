using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MediSales.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Users_IsArchived",
                table: "Users",
                column: "IsArchived");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_IsVoided",
                table: "Transactions",
                column: "IsVoided");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_TransactionDate_IsVoided",
                table: "Transactions",
                columns: new[] { "TransactionDate", "IsVoided" });

            migrationBuilder.CreateIndex(
                name: "IX_Products_IsArchived",
                table: "Products",
                column: "IsArchived");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_IsArchived",
                table: "Messages",
                column: "IsArchived");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ToUserId_CreatedAt",
                table: "Messages",
                columns: new[] { "ToUserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_InventoryMovements_ProductId_CreatedAt",
                table: "InventoryMovements",
                columns: new[] { "ProductId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_IsArchived",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_IsVoided",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_TransactionDate_IsVoided",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Products_IsArchived",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Messages_IsArchived",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Messages_ToUserId_CreatedAt",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_InventoryMovements_ProductId_CreatedAt",
                table: "InventoryMovements");
        }
    }
}
