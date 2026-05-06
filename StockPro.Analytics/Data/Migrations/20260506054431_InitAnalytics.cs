using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StockPro.Analytics.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitAnalytics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "InventorySnapshots",
                columns: table => new
                {
                    SnapshotId = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    StockValue = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    SnapshotDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventorySnapshots", x => x.SnapshotId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InventorySnapshots_ProductId_SnapshotDate",
                table: "InventorySnapshots",
                columns: new[] { "ProductId", "SnapshotDate" });

            migrationBuilder.CreateIndex(
                name: "IX_InventorySnapshots_ProductId_WarehouseId_SnapshotDate",
                table: "InventorySnapshots",
                columns: new[] { "ProductId", "WarehouseId", "SnapshotDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InventorySnapshots_WarehouseId_SnapshotDate",
                table: "InventorySnapshots",
                columns: new[] { "WarehouseId", "SnapshotDate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InventorySnapshots");
        }
    }
}
