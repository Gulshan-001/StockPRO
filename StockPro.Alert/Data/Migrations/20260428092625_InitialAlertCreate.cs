using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StockPro.Alert.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialAlertCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Alerts",
                columns: table => new
                {
                    AlertId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecipientId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Severity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    RelatedProductId = table.Column<Guid>(type: "uuid", nullable: true),
                    RelatedWarehouseId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    IsAcknowledged = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Alerts", x => x.AlertId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Alerts_RecipientId_IsAcknowledged",
                table: "Alerts",
                columns: new[] { "RecipientId", "IsAcknowledged" });

            migrationBuilder.CreateIndex(
                name: "IX_Alerts_Type_RelatedProductId_RelatedWarehouseId_IsAcknowled~",
                table: "Alerts",
                columns: new[] { "Type", "RelatedProductId", "RelatedWarehouseId", "IsAcknowledged" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Alerts");
        }
    }
}
