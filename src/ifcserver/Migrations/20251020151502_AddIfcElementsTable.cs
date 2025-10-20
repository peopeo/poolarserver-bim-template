using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace IfcServer.Migrations
{
    /// <inheritdoc />
    public partial class AddIfcElementsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ConversionJobs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    InputPath = table.Column<string>(type: "text", nullable: false),
                    OutputPath = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Error = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConversionJobs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "IfcModels",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FileHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ProjectName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Schema = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ModelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    EntityCountsJson = table.Column<string>(type: "jsonb", nullable: true),
                    Author = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Organization = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Application = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    IfcFilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    GltfFilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    GltfFileSizeBytes = table.Column<long>(type: "bigint", nullable: true),
                    SpatialTreeJson = table.Column<string>(type: "jsonb", nullable: true),
                    ConversionStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ConversionError = table.Column<string>(type: "text", nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastAccessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ConvertedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Tags = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IfcModels", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "IfcElements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ModelId = table.Column<int>(type: "integer", nullable: false),
                    GlobalId = table.Column<string>(type: "character varying(22)", maxLength: 22, nullable: false),
                    ElementType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    PropertiesJson = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IfcElements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IfcElements_IfcModels_ModelId",
                        column: x => x.ModelId,
                        principalTable: "IfcModels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IfcElements_ElementType",
                table: "IfcElements",
                column: "ElementType");

            migrationBuilder.CreateIndex(
                name: "IX_IfcElements_ModelId",
                table: "IfcElements",
                column: "ModelId");

            migrationBuilder.CreateIndex(
                name: "IX_IfcElements_ModelId_GlobalId",
                table: "IfcElements",
                columns: new[] { "ModelId", "GlobalId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_IfcElements_PropertiesJson",
                table: "IfcElements",
                column: "PropertiesJson")
                .Annotation("Npgsql:IndexMethod", "gin");

            migrationBuilder.CreateIndex(
                name: "IX_IfcModels_ConversionStatus",
                table: "IfcModels",
                column: "ConversionStatus");

            migrationBuilder.CreateIndex(
                name: "IX_IfcModels_FileHash",
                table: "IfcModels",
                column: "FileHash");

            migrationBuilder.CreateIndex(
                name: "IX_IfcModels_ProjectName",
                table: "IfcModels",
                column: "ProjectName");

            migrationBuilder.CreateIndex(
                name: "IX_IfcModels_Schema",
                table: "IfcModels",
                column: "Schema");

            migrationBuilder.CreateIndex(
                name: "IX_IfcModels_UploadedAt",
                table: "IfcModels",
                column: "UploadedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConversionJobs");

            migrationBuilder.DropTable(
                name: "IfcElements");

            migrationBuilder.DropTable(
                name: "IfcModels");
        }
    }
}
