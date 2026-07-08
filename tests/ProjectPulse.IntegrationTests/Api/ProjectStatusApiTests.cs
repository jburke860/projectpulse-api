using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Application.Projects.Dtos;

namespace ProjectPulse.IntegrationTests.Api;

public class ProjectStatusApiTests : IntegrationTestBase
{
    public ProjectStatusApiTests(CustomWebApplicationFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task CreateProject_WithExplicitStatus_ReturnsThatStatus()
    {
        var response = await Client.PostAsJsonAsync(
            "/api/projects",
            new CreateProjectRequest($"Status Test {Guid.NewGuid():N}", null, "OnHold"));
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResult<ProjectDto>>();
        body!.Data!.Status.Should().Be("OnHold");
    }

    [Fact]
    public async Task CreateProject_WithoutStatus_DefaultsToActive()
    {
        var response = await Client.PostAsJsonAsync(
            "/api/projects",
            new CreateProjectRequest($"Default Status {Guid.NewGuid():N}", null));
        var body = await response.Content.ReadFromJsonAsync<ApiResult<ProjectDto>>();
        body!.Data!.Status.Should().Be("Active");
    }

    [Fact]
    public async Task UpdateProject_ChangesStatusAndPersists()
    {
        var created = await (await Client.PostAsJsonAsync(
            "/api/projects",
            new CreateProjectRequest($"Update Status {Guid.NewGuid():N}", "Before", "Planning")))
            .Content.ReadFromJsonAsync<ApiResult<ProjectDto>>();
        var projectId = created!.Data!.Id;

        var updateResponse = await Client.PutAsJsonAsync(
            $"/api/projects/{projectId}",
            new UpdateProjectRequest(created.Data.Name, "After", "Completed"));
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var fetched = await (await Client.GetAsync($"/api/projects/{projectId}"))
            .Content.ReadFromJsonAsync<ApiResult<ProjectDto>>();
        fetched!.Data!.Status.Should().Be("Completed");
        fetched.Data.Description.Should().Be("After");
    }

    [Fact]
    public async Task UpdateProject_WithUnknownStatus_ReturnsBadRequest()
    {
        var created = await (await Client.PostAsJsonAsync(
            "/api/projects",
            new CreateProjectRequest($"Bad Status {Guid.NewGuid():N}", null)))
            .Content.ReadFromJsonAsync<ApiResult<ProjectDto>>();

        var response = await Client.PutAsJsonAsync(
            $"/api/projects/{created!.Data!.Id}",
            new UpdateProjectRequest(created.Data.Name, null, "NotAStatus"));
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DemoSession_SeedsVariedProjectStatuses()
    {
        var session = await CreateDemoSession();
        var response = await SendWithDemoSessionAsync(HttpMethod.Get, "/api/projects?pageSize=100", session.SessionId);
        var projects = await response.Content.ReadFromJsonAsync<ApiResult<PagedResult<ProjectDto>>>();

        var statuses = projects!.Data!.Items.Select(p => p.Status).Distinct().ToList();
        statuses.Should().Contain(["Active", "Planning", "OnHold", "Completed"]);
    }
}
