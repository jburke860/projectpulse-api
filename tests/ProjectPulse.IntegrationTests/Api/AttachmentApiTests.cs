using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Application.Tasks.Dtos;
using ProjectPulse.Infrastructure.Persistence;

namespace ProjectPulse.IntegrationTests.Api;

public class AttachmentApiTests : IntegrationTestBase
{
    private static readonly byte[] PngBytes = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3, 4];

    public AttachmentApiTests(CustomWebApplicationFactory factory) : base(factory)
    {
    }

    private async Task<Guid> GetSharedWorkspaceTaskId()
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.Tasks
            .Where(t => t.Project.Members.Any(m => m.UserId == SeedData.DemoAdminUserId))
            .Select(t => t.Id)
            .FirstAsync();
    }

    private async Task<Guid> GetSharedWorkspaceProjectId()
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.Projects
            .Where(p => p.Members.Any(m => m.UserId == SeedData.DemoAdminUserId))
            .Select(p => p.Id)
            .FirstAsync();
    }

    private static MultipartFormDataContent FileContent(byte[] bytes, string fileName, string contentType)
    {
        var content = new ByteArrayContent(bytes);
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
        return new MultipartFormDataContent { { content, "file", fileName } };
    }

    [Fact]
    public async Task UploadDownloadDelete_RoundTrips()
    {
        var taskId = await GetSharedWorkspaceTaskId();

        var uploadResponse = await Client.PostAsync(
            $"/api/tasks/{taskId}/attachments",
            FileContent(PngBytes, "evidence.png", "image/png"));
        uploadResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var uploaded = await uploadResponse.Content.ReadFromJsonAsync<ApiResult<AttachmentDto>>();
        uploaded!.Data!.FileName.Should().Be("evidence.png");
        uploaded.Data.SizeBytes.Should().Be(PngBytes.Length);

        var downloadResponse = await Client.GetAsync(
            $"/api/tasks/{taskId}/attachments/{uploaded.Data.Id}/download");
        downloadResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        downloadResponse.Content.Headers.ContentType!.MediaType.Should().Be("image/png");
        (await downloadResponse.Content.ReadAsByteArrayAsync()).Should().Equal(PngBytes);

        var listResponse = await Client.GetAsync($"/api/tasks/{taskId}/attachments");
        var list = await listResponse.Content.ReadFromJsonAsync<ApiResult<List<AttachmentDto>>>();
        list!.Data.Should().Contain(a => a.Id == uploaded.Data.Id);

        var deleteResponse = await Client.DeleteAsync(
            $"/api/tasks/{taskId}/attachments/{uploaded.Data.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var downloadAfterDelete = await Client.GetAsync(
            $"/api/tasks/{taskId}/attachments/{uploaded.Data.Id}/download");
        downloadAfterDelete.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Upload_WritesAuditEntries()
    {
        var taskId = await GetSharedWorkspaceTaskId();

        var uploaded = await (await Client.PostAsync(
                $"/api/tasks/{taskId}/attachments",
                FileContent(PngBytes, "audit-check.png", "image/png")))
            .Content.ReadFromJsonAsync<ApiResult<AttachmentDto>>();

        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logged = await db.AuditLogs.AnyAsync(a =>
            a.TaskId == taskId &&
            a.EntityType == "Attachment" &&
            a.Message.Contains("audit-check.png"));
        logged.Should().BeTrue();

        await Client.DeleteAsync($"/api/tasks/{taskId}/attachments/{uploaded!.Data!.Id}");
    }

    [Fact]
    public async Task Upload_OversizedFile_ReturnsBadRequest()
    {
        var taskId = await GetSharedWorkspaceTaskId();
        var oversized = new byte[5 * 1024 * 1024 + 1];

        var response = await Client.PostAsync(
            $"/api/tasks/{taskId}/attachments",
            FileContent(oversized, "big.png", "image/png"));
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Upload_DisallowedExtension_ReturnsBadRequest()
    {
        var taskId = await GetSharedWorkspaceTaskId();

        var response = await Client.PostAsync(
            $"/api/tasks/{taskId}/attachments",
            FileContent(PngBytes, "malware.exe", "application/octet-stream"));
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Download_SeededAttachmentWithoutFile_ReturnsGeneratedContent()
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var seeded = await db.Attachments
            .Where(a =>
                a.StorageKey.StartsWith("demo/") &&
                a.TaskId != null &&
                a.Task!.Project.Members.Any(m => m.UserId == SeedData.DemoAdminUserId))
            .Select(a => new { a.Id, TaskId = a.TaskId!.Value })
            .FirstAsync();

        var response = await Client.GetAsync($"/api/tasks/{seeded.TaskId}/attachments/{seeded.Id}/download");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadAsByteArrayAsync()).Should().NotBeEmpty();
    }

    [Fact]
    public async Task ProjectAttachments_UploadDownloadDelete_RoundTrips()
    {
        var projectId = await GetSharedWorkspaceProjectId();
        var contentBytes = "Launch brief\nOwner,Status\nJeremy Burke,Ready\n"u8.ToArray();

        var uploadResponse = await Client.PostAsync(
            $"/api/projects/{projectId}/attachments",
            FileContent(contentBytes, "launch-brief.csv", "text/csv"));
        uploadResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var uploaded = await uploadResponse.Content.ReadFromJsonAsync<ApiResult<AttachmentDto>>();
        uploaded!.Data!.ProjectId.Should().Be(projectId);
        uploaded.Data.TaskId.Should().BeNull();
        uploaded.Data.FileName.Should().Be("launch-brief.csv");

        var listResponse = await Client.GetAsync($"/api/projects/{projectId}/attachments");
        var list = await listResponse.Content.ReadFromJsonAsync<ApiResult<List<AttachmentDto>>>();
        list!.Data.Should().Contain(a => a.Id == uploaded.Data.Id);

        var downloadResponse = await Client.GetAsync(
            $"/api/projects/{projectId}/attachments/{uploaded.Data.Id}/download");
        downloadResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        (await downloadResponse.Content.ReadAsByteArrayAsync()).Should().Equal(contentBytes);

        var deleteResponse = await Client.DeleteAsync(
            $"/api/projects/{projectId}/attachments/{uploaded.Data.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var downloadAfterDelete = await Client.GetAsync(
            $"/api/projects/{projectId}/attachments/{uploaded.Data.Id}/download");
        downloadAfterDelete.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Download_FromAnotherSession_ReturnsNotFound()
    {
        var taskId = await GetSharedWorkspaceTaskId();
        var uploaded = await (await Client.PostAsync(
                $"/api/tasks/{taskId}/attachments",
                FileContent(PngBytes, "private.png", "image/png")))
            .Content.ReadFromJsonAsync<ApiResult<AttachmentDto>>();

        var otherSession = await CreateDemoSession();
        var response = await SendWithDemoSessionAsync(
            HttpMethod.Get,
            $"/api/tasks/{taskId}/attachments/{uploaded!.Data!.Id}/download",
            otherSession.SessionId);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        await Client.DeleteAsync($"/api/tasks/{taskId}/attachments/{uploaded.Data.Id}");
    }
}
