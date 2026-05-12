BEGIN;
INSERT INTO "StockMovements" ("MovementId", "ProductId", "WarehouseId", "MovementType", "Quantity", "UnitCost", "ReferenceId", "ReferenceType", "PerformedBy", "Notes", "MovementDate", "BalanceAfter") 
VALUES (gen_random_uuid(), '83aa9386-b197-4baa-a6a5-b5d7faef73e6', '801fe44b-012f-4210-b390-7c5f68caa22a', 'STOCK_IN', 90, 10000, 'a2fe9ee9-c841-4b43-8b66-4536640b9a40', 'PURCHASE_ORDER', '00000000-0000-0000-0000-000000000000', 'Manual recovery of missed GRN sync', now(), 120);

UPDATE "StockLevels" SET "Quantity" = "Quantity" + 90, "LastUpdated" = now() WHERE "WarehouseId" = '801fe44b-012f-4210-b390-7c5f68caa22a' AND "ProductId" = '83aa9386-b197-4baa-a6a5-b5d7faef73e6';
COMMIT;
