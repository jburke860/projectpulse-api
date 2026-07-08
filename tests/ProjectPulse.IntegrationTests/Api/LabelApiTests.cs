using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Application.Projects.Dtos;
using ProjectPulse.Application.Tasks.Dtos;

namespace ProjectPulse.IntegrationTests.Api;

public class LabelApiTests : IntegrationTestBase
{
    public LabelApiTests(CustomWebApplicationFactory factory) : base(factory)
    {
    }

    private async Task<(string SessionId, ProjectDto Project, TaskDto Task, List<LabelDto> Labels)> SetupAsync()
    {
        var session = await CreateDemoSession();

        var projects = await (await SendWithDemoSessionAsync(HttpMethod.Get, "/api/projects?pageSize=100", session.SessionId))
            .Content.ReadFromJsonAsync<ApiResult<PagedResult<ProjectDto>>>();
        var project = projects!.Data!.Items.First();

        var tasks = await (await SendWithDemoSessionAsync(
                HttpMethod.Get, $"/api/tasks?projectId={project.Id}&pageSize=100", session.SessionId))
            .Content.ReadFromJsonAsync<ApiResult<PagedResult<TaskDto>>>();
        var task = tasks!.Data!.Items.First();

        var labels = await (await SendWithDemoSessionAsync(
                HttpMethod.Get, $"/api/projects/{project.Id}/labels", session.SessionId))
            .Content.ReadFromJsonAsync<ApiResult<List<LabelDto>>>();

        return (session.SessionId, project, task, labels!.Data!);
    }

    [Fact]
    public async Task GetProjectLabels_ReturnsSeededLabels()
    {
        var (_, _, _, labels) = await SetupAsync();

        labels.Should().HaveCountGreaterThanOrEqualTo(8);
        labels.Select(l => l.Name).Should().Contain(["frontend", "backend", "qa", "security"]);
        labels.Should().OnlyContain(l => l.Color.StartsWith("#"));
    }

    [Fact]
    public async Task AttachAndDetachLabel_UpdatesTaskLabels()
    {
        var (sessionId, _, task, labels) = await SetupAsync();
        var label = labels.First(l => !task.Labels.Any(existing => existing.Id == l.Id));

        var attachResponse = await SendWithDemoSessionAsync(
            HttpMethod.Post, $"/api/tasks/{task.Id}/labels", sessionId, new AttachLabelRequest(label.Id));
        attachResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var attached = await attachResponse.Content.ReadFromJsonAsync<ApiResult<TaskDto>>();
        attached!.Data!.Labels.Should().Contain(l => l.Id == label.Id);

        var duplicateResponse = await SendWithDemoSessionAsync(
            HttpMethod.Post, $"/api/tasks/{task.Id}/labels", sessionId, new AttachLabelRequest(label.Id));
        duplicateResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var detachResponse = await SendWithDemoSessionAsync(
            HttpMethod.Delete, $"/api/tasks/{task.Id}/labels/{label.Id}", sessionId);
        detachResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var detached = await detachResponse.Content.ReadFromJsonAsync<ApiResult<TaskDto>>();
        detached!.Data!.Labels.Should().NotContain(l => l.Id == label.Id);

        var detachAgainResponse = await SendWithDemoSessionAsync(
            HttpMethod.Delete, $"/api/tasks/{task.Id}/labels/{label.Id}", sessionId);
        detachAgainResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task AttachLabel_FromAnotherProject_ReturnsBadRequest()
    {
        var (sessionId, project, task, _) = await SetupAsync();

        var projects = await (await SendWithDemoSessionAsync(HttpMethod.Get, "/api/projects?pageSize=100", sessionId))
            .Content.ReadFromJsonAsync<ApiResult<PagedResult<ProjectDto>>>();
        var otherProject = projects!.Data!.Items.First(p => p.Id != project.Id);

        var otherLabels = await (await SendWithDemoSessionAsync(
                HttpMethod.Get, $"/api/projects/{otherProject.Id}/labels", sessionId))
            .Content.ReadFromJsonAsync<ApiResult<List<LabelDto>>>();

        var response = await SendWithDemoSessionAsync(
            HttpMethod.Post, $"/api/tasks/{task.Id}/labels", sessionId,
            new AttachLabelRequest(otherLabels!.Data!.First().Id));
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetProjectLabels_FromAnotherSession_ReturnsNotFound()
    {
        var (_, project, _, _) = await SetupAsync();
        var otherSession = await CreateDemoSession();

        var response = await SendWithDemoSessionAsync(
            HttpMethod.Get, $"/api/projects/{project.Id}/labels", otherSession.SessionId);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetTasks_IncludesLabelsInList()
    {
        var (sessionId, project, _, _) = await SetupAsync();

        var tasks = await (await SendWithDemoSessionAsync(
                HttpMethod.Get, $"/api/tasks?projectId={project.Id}&pageSize=100", sessionId))
            .Content.ReadFromJsonAsync<ApiResult<PagedResult<TaskDto>>>();

        tasks!.Data!.Items.Should().Contain(t => t.Labels.Count > 0);
    }
}
