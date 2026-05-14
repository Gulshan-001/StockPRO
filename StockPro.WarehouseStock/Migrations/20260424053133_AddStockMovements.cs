using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StockPro.WarehouseStock.Migrations
{
    /// <inheritdoc />
    public partial class AddStockMovements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // No-op: StockMovements table is owned by the StockMovement microservice.
            // It already exists in the shared database.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No-op: Do not drop tables owned by another service.
        }
    }
}
