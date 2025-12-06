using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MediSales.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTransactionVoiding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsVoided",
                table: "Transactions",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "VoidReason",
                table: "Transactions",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "VoidedAt",
                table: "Transactions",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VoidedBy",
                table: "Transactions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_VoidedBy",
                table: "Transactions",
                column: "VoidedBy");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Users_VoidedBy",
                table: "Transactions",
                column: "VoidedBy",
                principalTable: "Users",
                principalColumn: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Users_VoidedBy",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_VoidedBy",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "IsVoided",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "VoidReason",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "VoidedAt",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "VoidedBy",
                table: "Transactions");
        }
    }
}
