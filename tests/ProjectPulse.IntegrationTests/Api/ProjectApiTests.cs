using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ProjectPulse.Application.Audit.Dtos;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Application.Demo.Dtos;
using ProjectPulse.Application.Projects.Dtos;
using ProjectPulse.Application.Tasks.Commands;
using ProjectPulse.Application.Tasks.Dtos;
using ProjectPulse.Application.Common.Constants;
using ProjectPulse.Application.Users.Dtos;
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
    public async Task DemoSessions_IsolateProjectLists()
    {
        var sessionA = await CreateDemoSession();
        var sessionB = await CreateDemoSession();
        var projectName = $"Session A Project {Guid.NewGuid():N}";

        var createResponse = await SendWithDemoSessionAsync(
            HttpMethod.Post,
            "/api/projects",
            sessionA.SessionId,
            new CreateProjectRequest(projectName, "Created in one demo session"));
        createResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var sessionAProjectsResponse = await SendWithDemoSessionAsync(HttpMethod.Get, "/api/projects", sessionA.SessionId);
        sessionAProjectsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var sessionAProjects = await sessionAProjectsResponse.Content.ReadFromJsonAsync<ApiResult<PagedResult<ProjectDto>>>();
        sessionAProjects!.Data!.Items.Should().Contain(p => p.Name == projectName);

        var sessionBProjectsResponse = await SendWithDemoSessionAsync(HttpMethod.Get, "/api/projects", sessionB.SessionId);
        sessionBProjectsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var sessionBProjects = await sessionBProjectsResponse.Content.ReadFromJsonAsync<ApiResult<PagedResult<ProjectDto>>>();
        sessionBProjects!.Data!.Items.Should().NotContain(p => p.Name == projectName);
    }

    [Fact]
    public async Task DemoSession_SeedsRealisticWorkspace()
    {
        var session = await CreateDemoSession();
        var demoSessionId = Guid.Parse(session.SessionId);
        var sessionCode = DemoSessionConstants.EmailSessionCode(demoSessionId);
        var expectedStoredSarahEmail = DemoSessionConstants.SessionEmail(demoSessionId, "sarah.kim");

        var projectsResponse = await SendWithDemoSessionAsync(HttpMethod.Get, "/api/projects", session.SessionId);
        projectsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var projects = await projectsResponse.Content.ReadFromJsonAsync<ApiResult<PagedResult<ProjectDto>>>();
        projects!.Data!.Items.Should().HaveCountGreaterThanOrEqualTo(8);
        var projectData = projects.Data.Items;
        projectData.Select(p => p.Name).Should().Contain(
            ["Customer Portal Redesign", "Internal Ops Automation", "API Reliability Sprint"]);

        var usersResponse = await SendWithDemoSessionAsync(HttpMethod.Get, "/api/users?pageSize=100", session.SessionId);
        usersResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var users = await usersResponse.Content.ReadFromJsonAsync<ApiResult<PagedResult<UserDto>>>();
        users!.Data!.Items.Should().HaveCountGreaterThanOrEqualTo(15);
        var userData = users.Data.Items;
        userData.Select(u => u.DisplayName).Should().Contain(
            ["Jeremy Burke", "Sarah Kim", "Marcus Lee", "Priya Patel", "Daniel Roberts"]);
        userData.Single(u => u.DisplayName == "Sarah Kim").Email.Should().Be("sarah.kim@projectpulse.local");
        userData.Select(u => u.Email).Should().NotContain(email => email.Contains($".{sessionCode}@"));

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var storedSarahEmail = await db.Users
                .Where(u => u.DisplayName == "Sarah Kim")
                .Select(u => u.Email)
                .SingleAsync(email => email == expectedStoredSarahEmail);

            storedSarahEmail.Should().Be(expectedStoredSarahEmail);
        }

        var projectMembersResponse = await SendWithDemoSessionAsync(
            HttpMethod.Get,
            $"/api/projects/{projectData[0].Id}/members",
            session.SessionId);
        projectMembersResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var projectMembers = await projectMembersResponse.Content.ReadFromJsonAsync<ApiResult<List<ProjectMemberDto>>>();
        var projectMemberData = projectMembers!.Data!;
        projectMemberData.Select(m => m.Email).Should().NotContain(email => email.Contains($".{sessionCode}@"));

        var tasksResponse = await SendWithDemoSessionAsync(HttpMethod.Get, "/api/tasks?pageSize=100", session.SessionId);
        tasksResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var tasks = await tasksResponse.Content.ReadFromJsonAsync<ApiResult<PagedResult<TaskDto>>>();
        var taskData = tasks!.Data!.Items;
        taskData.Should().HaveCountGreaterThanOrEqualTo(40);
        tasks.Data.TotalCount.Should().BeGreaterThanOrEqualTo(40);
        taskData.Select(t => t.Title).Should().Contain(
            [
                "Finalize onboarding checklist copy",
                "Build account activity timeline",
                "Add validation for invalid task transitions"
            ]);
        taskData.Should().NotContain(t =>
            t.Title.Contains("Implement endpoint", StringComparison.OrdinalIgnoreCase) ||
            t.Title.Contains("Write integration test", StringComparison.OrdinalIgnoreCase) ||
            (t.Description != null && t.Description.Contains("seeded", StringComparison.OrdinalIgnoreCase)));
        taskData.Count(t => t.AssigneeId is not null).Should().BeGreaterThan(taskData.Count * 3 / 4);

        var timelineTask = taskData.First(t => t.Title == "Build account activity timeline");
        var commentsResponse = await SendWithDemoSessionAsync(
            HttpMethod.Get,
            $"/api/tasks/{timelineTask.Id}/comments",
            session.SessionId);
        commentsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var comments = await commentsResponse.Content.ReadFromJsonAsync<ApiResult<List<CommentDto>>>();
        comments!.Data.Should().Contain(c => c.Body.Contains("support's call notes", StringComparison.OrdinalIgnoreCase));

        var activityResponse = await SendWithDemoSessionAsync(HttpMethod.Get, "/api/activity?limit=50", session.SessionId);
        activityResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var activity = await activityResponse.Content.ReadFromJsonAsync<ApiResult<PagedResult<AuditLogDto>>>();
        activity!.Data!.Items.Should().Contain(a => a.Message.Contains("assigned", StringComparison.OrdinalIgnoreCase));
        activity.Data.Items.Should().Contain(a => a.Message.Contains("moved", StringComparison.OrdinalIgnoreCase));
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
            new CreateTaskRequest(projectId, "Task to delete", null, "Medium", SeedData.DemoAdminUserId, null));
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
    public async Task AddAndRemoveProjectMember_UpdatesMembershipAndUnassignsTasks()
    {
        var createProjectResponse = await _client.PostAsJsonAsync(
            "/api/projects",
            new CreateProjectRequest($"Member Test Project {Guid.NewGuid():N}", "Temporary project"));
        createProjectResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var createdProject = await createProjectResponse.Content.ReadFromJsonAsync<ApiResult<ProjectDto>>();
        var projectId = createdProject!.Data!.Id;

        Guid userId;
        string displayName;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var user = await db.ProjectMembers
                .Where(m => m.UserId != SeedData.DemoAdminUserId && m.Project.Members.Any(pm => pm.UserId == SeedData.DemoAdminUserId))
                .Select(m => m.User)
                .FirstAsync();
            userId = user.Id;
            displayName = user.DisplayName;
        }

        var addResponse = await _client.PostAsJsonAsync(
            $"/api/projects/{projectId}/members",
            new AddProjectMemberRequest(userId, "Member"));
        addResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var createTaskResponse = await _client.PostAsJsonAsync(
            "/api/tasks",
            new CreateTaskRequest(projectId, "Assigned member task", null, "Medium", userId, null));
        createTaskResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var createdTask = await createTaskResponse.Content.ReadFromJsonAsync<ApiResult<TaskDto>>();
        var taskId = createdTask!.Data!.Id;

        var removeResponse = await _client.DeleteAsync($"/api/projects/{projectId}/members/{userId}");
        removeResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        using var assertScope = _factory.Services.CreateScope();
        var assertDb = assertScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var memberExists = await assertDb.ProjectMembers.AnyAsync(m => m.ProjectId == projectId && m.UserId == userId);
        var task = await assertDb.Tasks.FirstAsync(t => t.Id == taskId);
        var removalLogged = await assertDb.AuditLogs.AnyAsync(a =>
            a.ProjectId == projectId &&
            a.Action == Domain.Enums.AuditAction.MemberRemoved &&
            a.Message.Contains(displayName));

        memberExists.Should().BeFalse();
        task.AssigneeId.Should().BeNull();
        removalLogged.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateTask_ChangesPriority()
    {
        var projectId = await GetSeededProjectId();
        var createTaskResponse = await _client.PostAsJsonAsync(
            "/api/tasks",
            new CreateTaskRequest(projectId, $"Priority Test Task {Guid.NewGuid():N}", null, "Medium", SeedData.DemoAdminUserId, null));
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

        var body = await response.Content.ReadFromJsonAsync<ApiResult<PagedResult<TaskDto>>>();
        body!.Success.Should().BeTrue();
        body.Data!.Items.Should().NotBeNull();
    }

    [Fact]
    public async Task TaskAssignment_RejectsViewerMembers()
    {
        Guid projectId;
        Guid viewerId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var viewer = await db.ProjectMembers
                .Where(m =>
                    m.Role == Domain.Enums.ProjectRole.Viewer &&
                    m.Project.Members.Any(pm => pm.UserId == SeedData.DemoAdminUserId))
                .Select(m => new { m.ProjectId, m.UserId })
                .FirstAsync();

            projectId = viewer.ProjectId;
            viewerId = viewer.UserId;
        }

        var createWithViewerResponse = await _client.PostAsJsonAsync(
            "/api/tasks",
            new CreateTaskRequest(projectId, "Viewer assignment should fail", null, "Medium", viewerId, null));
        createWithViewerResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var createWithAdminResponse = await _client.PostAsJsonAsync(
            "/api/tasks",
            new CreateTaskRequest(projectId, $"Assignable task {Guid.NewGuid():N}", null, "Medium", SeedData.DemoAdminUserId, null));
        createWithAdminResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var createdTask = await createWithAdminResponse.Content.ReadFromJsonAsync<ApiResult<TaskDto>>();

        var assignViewerResponse = await _client.PatchAsJsonAsync(
            $"/api/tasks/{createdTask!.Data!.Id}/assign",
            new AssignTaskRequest(viewerId));
        assignViewerResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
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
            SeedData.DemoAdminUserId,
            DateTime.UtcNow.AddDays(-2)));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ChangeTaskStatus_WritesAuditEntry()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var task = await db.Tasks.FirstAsync(t =>
            t.Status == Domain.Enums.TaskStatus.Open &&
            t.Project.Members.Any(m => m.UserId == SeedData.DemoAdminUserId));
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
        return await db.ProjectMembers
            .Where(m => m.UserId == SeedData.DemoAdminUserId)
            .Select(m => m.ProjectId)
            .FirstAsync();
    }

    private async Task<DemoSessionDto> CreateDemoSession()
    {
        var response = await _client.PostAsync("/api/demo/sessions", null);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResult<DemoSessionDto>>();
        body!.Data.Should().NotBeNull();
        return body.Data!;
    }

    private Task<HttpResponseMessage> SendWithDemoSessionAsync(
        HttpMethod method,
        string url,
        string sessionId,
        object? body = null)
    {
        var request = new HttpRequestMessage(method, url);
        request.Headers.Add(DemoSessionConstants.HeaderName, sessionId);

        if (body is not null)
        {
            request.Content = JsonContent.Create(body);
        }

        return _client.SendAsync(request);
    }
}
