using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Application.Projects.Dtos;
using ProjectPulse.Application.Tasks.Dtos;
using ProjectPulse.Infrastructure.Persistence;

namespace ProjectPulse.IntegrationTests.Api;

public class ProjectApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ProjectApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        SeedData.InitializeAsync(db).GetAwaiter().GetResult();
    }

    [Fact]
    public async Task CreateProject_ReturnsSuccess()
    {
        var response = await _client.PostAsJsonAsync("/api/projects", new CreateProjectRequest("Integration Test Project", "Created in test"));
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResult<ProjectDto>>();
        body!.Success.Should().BeTrue();
        body.Data!.Name.Should().Be("Integration Test Project");
    }

    [Fact]
    public async Task GetTasks_FilterByStatus_ReturnsResults()
    {
        var response = await _client.GetAsync("/api/tasks?status=Open");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResult<List<TaskDto>>>();
        body!.Success.Should().BeTrue();
        body.Data.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateTask_WithPastDueDate_ReturnsBadRequest()
    {
        var projectId = await GetSeededProjectId();
        var response = await _client.PostAsJsonAsync("/api/tasks", new CreateTaskRequest(
            projectId,
            "Invalid task",
            null,
            "High",
            DateTime.UtcNow.AddDays(-2)));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ChangeTaskStatus_WritesAuditEntry()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var task = await db.Tasks.FirstAsync(t => t.Status == Domain.Enums.TaskStatus.Open);
        var beforeCount = await db.AuditLogs.CountAsync(a => a.TaskId == task.Id);

        var response = await _client.PatchAsJsonAsync($"/api/tasks/{task.Id}/status", new ChangeTaskStatusRequest("InProgress"));
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var afterCount = await db.AuditLogs.CountAsync(a => a.TaskId == task.Id);
        afterCount.Should().BeGreaterThan(beforeCount);
    }

    private async Task<Guid> GetSeededProjectId()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.Projects.Select(p => p.Id).FirstAsync();
    }
}
