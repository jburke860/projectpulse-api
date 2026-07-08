using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectPulse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260708224000_AddProjectAttachments")]
    public partial class AddProjectAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("PRAGMA foreign_keys=OFF;");
            migrationBuilder.Sql(
                """
                CREATE TABLE "__temp_Attachments" (
                    "Id" TEXT NOT NULL CONSTRAINT "PK_Attachments" PRIMARY KEY,
                    "TaskId" TEXT NULL,
                    "ProjectId" TEXT NULL,
                    "FileName" TEXT NOT NULL,
                    "ContentType" TEXT NOT NULL,
                    "SizeBytes" INTEGER NOT NULL,
                    "StorageKey" TEXT NOT NULL,
                    "CreatedAtUtc" TEXT NOT NULL,
                    "UpdatedAtUtc" TEXT NULL,
                    CONSTRAINT "CK_Attachments_OneOwner" CHECK ((TaskId IS NOT NULL AND ProjectId IS NULL) OR (TaskId IS NULL AND ProjectId IS NOT NULL)),
                    CONSTRAINT "FK_Attachments_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id") ON DELETE CASCADE,
                    CONSTRAINT "FK_Attachments_Tasks_TaskId" FOREIGN KEY ("TaskId") REFERENCES "Tasks" ("Id") ON DELETE CASCADE
                );
                """);
            migrationBuilder.Sql(
                """
                INSERT INTO "__temp_Attachments" ("Id", "TaskId", "ProjectId", "FileName", "ContentType", "SizeBytes", "StorageKey", "CreatedAtUtc", "UpdatedAtUtc")
                SELECT "Id", "TaskId", NULL, "FileName", "ContentType", "SizeBytes", "StorageKey", "CreatedAtUtc", "UpdatedAtUtc"
                FROM "Attachments";
                """);
            migrationBuilder.Sql("""DROP TABLE "Attachments";""");
            migrationBuilder.Sql("""ALTER TABLE "__temp_Attachments" RENAME TO "Attachments";""");
            migrationBuilder.Sql("""CREATE INDEX "IX_Attachments_ProjectId" ON "Attachments" ("ProjectId");""");
            migrationBuilder.Sql("""CREATE INDEX "IX_Attachments_TaskId" ON "Attachments" ("TaskId");""");
            migrationBuilder.Sql("PRAGMA foreign_keys=ON;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("PRAGMA foreign_keys=OFF;");
            migrationBuilder.Sql(
                """
                CREATE TABLE "__temp_Attachments" (
                    "Id" TEXT NOT NULL CONSTRAINT "PK_Attachments" PRIMARY KEY,
                    "TaskId" TEXT NOT NULL,
                    "FileName" TEXT NOT NULL,
                    "ContentType" TEXT NOT NULL,
                    "SizeBytes" INTEGER NOT NULL,
                    "StorageKey" TEXT NOT NULL,
                    "CreatedAtUtc" TEXT NOT NULL,
                    "UpdatedAtUtc" TEXT NULL,
                    CONSTRAINT "FK_Attachments_Tasks_TaskId" FOREIGN KEY ("TaskId") REFERENCES "Tasks" ("Id") ON DELETE CASCADE
                );
                """);
            migrationBuilder.Sql(
                """
                INSERT INTO "__temp_Attachments" ("Id", "TaskId", "FileName", "ContentType", "SizeBytes", "StorageKey", "CreatedAtUtc", "UpdatedAtUtc")
                SELECT "Id", "TaskId", "FileName", "ContentType", "SizeBytes", "StorageKey", "CreatedAtUtc", "UpdatedAtUtc"
                FROM "Attachments"
                WHERE "TaskId" IS NOT NULL;
                """);
            migrationBuilder.Sql("""DROP TABLE "Attachments";""");
            migrationBuilder.Sql("""ALTER TABLE "__temp_Attachments" RENAME TO "Attachments";""");
            migrationBuilder.Sql("""CREATE INDEX "IX_Attachments_TaskId" ON "Attachments" ("TaskId");""");
            migrationBuilder.Sql("PRAGMA foreign_keys=ON;");
        }
    }
}
