using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Application.Users.Dtos;

namespace ProjectPulse.IntegrationTests.Api;

public class UserProfileApiTests : IntegrationTestBase
{
    public UserProfileApiTests(CustomWebApplicationFactory factory) : base(factory)
    {
    }

    private async Task<List<UserDto>> GetUsers(string sessionId)
    {
        var response = await SendWithDemoSessionAsync(HttpMethod.Get, "/api/users?pageSize=100", sessionId);
        var body = await response.Content.ReadFromJsonAsync<ApiResult<PagedResult<UserDto>>>();
        return [.. body!.Data!.Items];
    }

    [Fact]
    public async Task GetUserProfile_ReturnsMembershipsWithRolesAndTaskStats()
    {
        var session = await CreateDemoSession();
        var users = await GetUsers(session.SessionId);
        var busiest = users.OrderByDescending(u => u.AssignedTaskCount).First();

        var response = await SendWithDemoSessionAsync(
            HttpMethod.Get, $"/api/users/{busiest.Id}", session.SessionId);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var profile = (await response.Content.ReadFromJsonAsync<ApiResult<UserProfileDto>>())!.Data!;

        profile.DisplayName.Should().Be(busiest.DisplayName);
        profile.Email.Should().Be(busiest.Email);
        profile.JoinedAtUtc.Should().BeBefore(DateTime.UtcNow);
        profile.Memberships.Should().HaveCount(busiest.ProjectCount);
        profile.Memberships.Should().OnlyContain(m =>
            m.Role == "Viewer" || m.Role == "Member" || m.Role == "Admin");
        profile.Memberships.Should().OnlyContain(m => !string.IsNullOrWhiteSpace(m.ProjectName));
        profile.ActiveTaskCount.Should().Be(busiest.AssignedTaskCount);
        profile.OverdueTaskCount.Should().BeLessThanOrEqualTo(profile.ActiveTaskCount);
    }

    [Fact]
    public async Task GetUserProfile_ActivityContainsOnlyThatActor()
    {
        var session = await CreateDemoSession();

        // Seeded audit logs are actored by the session admin, so their profile
        // is guaranteed to have activity.
        var response = await SendWithDemoSessionAsync(
            HttpMethod.Get, $"/api/users/{session.UserId}", session.SessionId);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var profile = (await response.Content.ReadFromJsonAsync<ApiResult<UserProfileDto>>())!.Data!;

        profile.RecentActivity.Should().NotBeEmpty();
        profile.RecentActivity.Should().HaveCountLessThanOrEqualTo(8);
        profile.RecentActivity.Should().OnlyContain(a => a.ActorId == session.UserId);
        profile.RecentActivity.Should().BeInDescendingOrder(a => a.CreatedAtUtc);
    }

    [Fact]
    public async Task GetUserProfile_HidesUsersFromOtherSessions()
    {
        var sessionA = await CreateDemoSession();
        var sessionB = await CreateDemoSession();

        var response = await SendWithDemoSessionAsync(
            HttpMethod.Get, $"/api/users/{sessionB.UserId}", sessionA.SessionId);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
