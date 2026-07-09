using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using ProjectPulse.Application.Attachments.Dtos;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Application.Dashboard.Dtos;
using ProjectPulse.Application.Tasks.Dtos;
using ProjectPulse.Application.Users.Dtos;

namespace ProjectPulse.IntegrationTests.Api;

public class WorkspaceAggregatesApiTests : IntegrationTestBase
{
    public WorkspaceAggregatesApiTests(CustomWebApplicationFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task Dashboard_ReturnsStatusBreakdownsAndTeamCount()
    {
        var session = await CreateDemoSession();

        var response = await SendWithDemoSessionAsync(HttpMethod.Get, "/api/dashboard", session.SessionId);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var dashboard = (await response.Content.ReadFromJsonAsync<ApiResult<DashboardDto>>())!.Data!;

        dashboard.TeamMemberCount.Should().Be(15);
        dashboard.TotalTasks.Should().Be(40);
        dashboard.TasksByStatus.Should().HaveCount(5);
        dashboard.TasksByStatus.Select(s => s.Status).Should()
            .BeEquivalentTo(["Open", "InProgress", "InReview", "Done", "Cancelled"]);
        dashboard.TasksByStatus.Sum(s => s.Count).Should().Be(dashboard.TotalTasks);
        dashboard.ProjectsByStatus.Should().HaveCount(4);
        dashboard.ProjectsByStatus.Select(s => s.Status).Should()
            .BeEquivalentTo(["Planning", "Active", "OnHold", "Completed"]);
        dashboard.ProjectsByStatus.Sum(s => s.Count).Should().Be(dashboard.TotalProjects);
    }

    [Fact]
    public async Task Tasks_IncludeProjectName()
    {
        var session = await CreateDemoSession();

        var list = (await (await SendWithDemoSessionAsync(
                HttpMethod.Get, "/api/tasks?pageSize=5", session.SessionId))
            .Content.ReadFromJsonAsync<ApiResult<PagedResult<TaskDto>>>())!.Data!;

        list.Items.Should().OnlyContain(t => !string.IsNullOrWhiteSpace(t.ProjectName));

        var detail = (await (await SendWithDemoSessionAsync(
                HttpMethod.Get, $"/api/tasks/{list.Items[0].Id}", session.SessionId))
            .Content.ReadFromJsonAsync<ApiResult<TaskDto>>())!.Data!;

        detail.ProjectName.Should().Be(list.Items[0].ProjectName);
    }

    [Fact]
    public async Task Users_IncludeProjectAndActiveTaskCounts()
    {
        var session = await CreateDemoSession();

        var users = (await (await SendWithDemoSessionAsync(
                HttpMethod.Get, "/api/users?pageSize=100", session.SessionId))
            .Content.ReadFromJsonAsync<ApiResult<PagedResult<UserDto>>>())!.Data!;

        users.Items.Should().HaveCount(15);
        // Every seeded member belongs to at least one project.
        users.Items.Should().OnlyContain(u => u.ProjectCount >= 1);
        // Seeded assignees carry active (not Done/Cancelled) tasks.
        users.Items.Sum(u => u.AssignedTaskCount).Should().BeGreaterThan(0);
        users.Items.Max(u => u.ProjectCount).Should().BeLessThanOrEqualTo(8);
    }

    [Fact]
    public async Task WorkspaceAttachments_ReturnProjectAndTaskContext()
    {
        var session = await CreateDemoSession();

        var response = await SendWithDemoSessionAsync(
            HttpMethod.Get, "/api/attachments?pageSize=100", session.SessionId);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var page = (await response.Content.ReadFromJsonAsync<ApiResult<PagedResult<WorkspaceAttachmentDto>>>())!.Data!;

        // 8 projects x 3 seeded project files, plus seeded task attachments.
        page.TotalCount.Should().BeGreaterThanOrEqualTo(24);
        page.Items.Should().OnlyContain(a => !string.IsNullOrWhiteSpace(a.ProjectName));
        page.Items.Should().Contain(a => a.TaskId == null);
        page.Items.Should().Contain(a => a.TaskId != null && !string.IsNullOrWhiteSpace(a.TaskTitle));
    }

    [Fact]
    public async Task WorkspaceAttachments_AreIsolatedPerSession()
    {
        var sessionA = await CreateDemoSession();
        var sessionB = await CreateDemoSession();

        var pageA = (await (await SendWithDemoSessionAsync(
                HttpMethod.Get, "/api/attachments?pageSize=100", sessionA.SessionId))
            .Content.ReadFromJsonAsync<ApiResult<PagedResult<WorkspaceAttachmentDto>>>())!.Data!;
        var pageB = (await (await SendWithDemoSessionAsync(
                HttpMethod.Get, "/api/attachments?pageSize=100", sessionB.SessionId))
            .Content.ReadFromJsonAsync<ApiResult<PagedResult<WorkspaceAttachmentDto>>>())!.Data!;

        pageA.Items.Select(a => a.Id).Should().NotIntersectWith(pageB.Items.Select(a => a.Id));
    }
}
