START TRANSACTION;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "IX_Todos_Category" ON "Todos" ("Category");

CREATE INDEX "IX_Todos_Description" ON "Todos" USING gin ("Description" gin_trgm_ops);

CREATE INDEX "IX_Todos_Priority" ON "Todos" ("Priority");

CREATE INDEX "IX_Todos_Status" ON "Todos" ("Status");

CREATE INDEX "IX_Todos_Title" ON "Todos" USING gin ("Title" gin_trgm_ops);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260619075941_AddTrigramAndIndexes', '10.0.5');

COMMIT;

INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"") VALUES ('20260618024326_InitialPostgresCreate', '10.0.5');
