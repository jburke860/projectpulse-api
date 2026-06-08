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
    public async Task DeleteProject_RemovesProjectAndTasks()
    {
        var createProjectResponse = await _client.PostAsJsonAsync(
            "/api/projects",
            new CreateProjectRequest($"Delete Test Project {Guid.NewGuid():N}", "Temporary project"));
        createProjectResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var createdProject = await createProjectResponse.Content.ReadFromJsonAsync<ApiResult<ProjectDto>>();
        var projectId = createdProject!.Data!.Id;

        var createTaskResponse = await _client.PostAsJsonAsync(
            "/api/tasks",
            new CreateTaskRequest(projectId, "Task to delete", null, "Medium", null));
        createTaskResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var deleteResponse = await _client.DeleteAsync($"/api/projects/{projectId}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var getResponse = await _client.GetAsync($"/api/projects/{projectId}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId);
        var taskExists = await db.Tasks.AnyAsync(t => t.ProjectId == projectId);

        projectExists.Should().BeFalse();
        taskExists.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateTask_ChangesPriority()
    {
        var projectId = await GetSeededProjectId();
        var createTaskResponse = await _client.PostAsJsonAsync(
            "/api/tasks",
            new CreateTaskRequest(projectId, $"Priority Test Task {Guid.NewGuid():N}", null, "Medium", null));
        createTaskResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var createdTask = await createTaskResponse.Content.ReadFromJsonAsync<ApiResult<TaskDto>>();
        var taskId = createdTask!.Data!.Id;

        var updateResponse = await _client.PutAsJsonAsync(
            $"/api/tasks/{taskId}",
            new UpdateTaskRequest("Updated priority test task", "Updated description", "High", null));
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updatedTask = await updateResponse.Content.ReadFromJsonAsync<ApiResult<TaskDto>>();
        updatedTask!.Data!.Priority.Should().Be("High");

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var persistedTask = await db.Tasks.FirstAsync(t => t.Id == taskId);

        persistedTask.Priority.Should().Be(Domain.Enums.TaskPriority.High);
        persistedTask.Title.Should().Be("Updated priority test task");
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

        var body = await response.Content.ReadFromJsonAsync<ApiResult<TaskDto>>();
        body!.Data!.Status.Should().Be("InProgress");

        var afterCount = await db.AuditLogs.CountAsync(a => a.TaskId == task.Id);
        afterCount.Should().BeGreaterThan(beforeCount);

        using var assertScope = _factory.Services.CreateScope();
        var assertDb = assertScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var persistedTask = await assertDb.Tasks.FirstAsync(t => t.Id == task.Id);
        persistedTask.Status.Should().Be(Domain.Enums.TaskStatus.InProgress);
    }

    private async Task<Guid> GetSeededProjectId()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.Projects.Select(p => p.Id).FirstAsync();
    }
}
