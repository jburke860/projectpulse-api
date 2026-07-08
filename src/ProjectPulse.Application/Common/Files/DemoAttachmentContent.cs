using System.IO.Compression;
using System.Text;
using ProjectPulse.Application.Tasks.Dtos;

namespace ProjectPulse.Application.Common.Files;

public static class DemoAttachmentContent
{
    private static readonly byte[] PngBytes = Convert.FromBase64String(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=");

    public static AttachmentDownloadDto Create(string fileName, string contentType)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var content = extension switch
        {
            ".png" => new MemoryStream(PngBytes),
            ".pdf" => CreatePdf(fileName),
            ".docx" => CreateDocx(fileName),
            ".xlsx" => CreateXlsx(fileName),
            ".zip" => CreateZip(fileName),
            ".json" => CreateText("""
                {
                  "source": "ProjectPulse demo",
                  "status": "Example attachment content",
                  "note": "Seeded demo files are generated on download."
                }
                """),
            ".csv" => CreateText("section,status,owner\nDemo attachment,Available,ProjectPulse\n"),
            _ => CreateText($"""
                # {Path.GetFileNameWithoutExtension(fileName)}

                This is generated demo content for a seeded ProjectPulse attachment.
                Uploaded files use normal file storage; seeded files are generated on demand for the demo workspace.
                """)
        };

        content.Position = 0;
        return new AttachmentDownloadDto(fileName, contentType, content);
    }

    public static bool IsDemoStorageKey(string storageKey) =>
        storageKey.StartsWith("demo/", StringComparison.OrdinalIgnoreCase);

    private static MemoryStream CreateText(string text) =>
        new(Encoding.UTF8.GetBytes(text));

    private static MemoryStream CreatePdf(string fileName)
    {
        var title = Path.GetFileNameWithoutExtension(fileName);
        return CreateText($"""
            %PDF-1.4
            1 0 obj
            << /Type /Catalog /Pages 2 0 R >>
            endobj
            2 0 obj
            << /Type /Pages /Kids [3 0 R] /Count 1 >>
            endobj
            3 0 obj
            << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
            endobj
            4 0 obj
            << /Length 92 >>
            stream
            BT /F1 18 Tf 72 720 Td ({EscapePdf(title)} demo attachment) Tj ET
            endstream
            endobj
            xref
            0 5
            0000000000 65535 f
            trailer
            << /Root 1 0 R >>
            %%EOF
            """);
    }

    private static MemoryStream CreateDocx(string fileName)
    {
        var stream = new MemoryStream();
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddZipEntry(archive, "[Content_Types].xml",
                """<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>""");
            AddZipEntry(archive, "_rels/.rels",
                """<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>""");
            AddZipEntry(archive, "word/document.xml",
                $"""<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{EscapeXml(Path.GetFileNameWithoutExtension(fileName))} demo attachment</w:t></w:r></w:p></w:body></w:document>""");
        }

        stream.Position = 0;
        return stream;
    }

    private static MemoryStream CreateXlsx(string fileName)
    {
        var stream = new MemoryStream();
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddZipEntry(archive, "[Content_Types].xml",
                """<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>""");
            AddZipEntry(archive, "_rels/.rels",
                """<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>""");
            AddZipEntry(archive, "xl/workbook.xml",
                """<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Demo" sheetId="1" r:id="rId1"/></sheets></workbook>""");
            AddZipEntry(archive, "xl/_rels/workbook.xml.rels",
                """<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>""");
            AddZipEntry(archive, "xl/worksheets/sheet1.xml",
                $"""<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>{EscapeXml(Path.GetFileNameWithoutExtension(fileName))} demo attachment</t></is></c></row></sheetData></worksheet>""");
        }

        stream.Position = 0;
        return stream;
    }

    private static MemoryStream CreateZip(string fileName)
    {
        var stream = new MemoryStream();
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddZipEntry(archive, "README.txt", $"{Path.GetFileNameWithoutExtension(fileName)} demo attachment");
        }

        stream.Position = 0;
        return stream;
    }

    private static void AddZipEntry(ZipArchive archive, string path, string content)
    {
        var entry = archive.CreateEntry(path);
        using var writer = new StreamWriter(entry.Open(), Encoding.UTF8);
        writer.Write(content);
    }

    private static string EscapePdf(string value) =>
        value.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");

    private static string EscapeXml(string value) =>
        value
            .Replace("&", "&amp;")
            .Replace("<", "&lt;")
            .Replace(">", "&gt;")
            .Replace("\"", "&quot;");
}
