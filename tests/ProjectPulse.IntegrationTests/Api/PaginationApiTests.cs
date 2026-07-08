using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using ProjectPulse.Application.Audit.Dtos;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Application.Tasks.Dtos;

namespace ProjectPulse.IntegrationTests.Api;

public class PaginationApiTests : IntegrationTestBase
{
    public PaginationApiTests(CustomWebApplicationFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task GetTasks_RespectsPageSizeAndReportsTotals()
    {
        var session = await CreateDemoSession();

        var response = await SendWithDemoSessionAsync(HttpMethod.Get, "/api/tasks?pageSize=5", session.SessionId);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResult<PagedResult<TaskDto>>>();
        var page = body!.Data!;
        page.Items.Should().HaveCount(5);
        page.TotalCount.Should().BeGreaterThanOrEqualTo(40);
        page.PageSize.Should().Be(5);
        page.Page.Should().Be(1);
        page.HasNextPage.Should().BeTrue();
    }

    [Fact]
    public async Task GetTasks_SecondPage_ReturnsDifferentItems()
    {
        var session = await CreateDemoSession();

        var firstPage = await (await SendWithDemoSessionAsync(
                HttpMethod.Get, "/api/tasks?pageSize=5&page=1", session.SessionId))
            .Content.ReadFromJsonAsync<ApiResult<PagedResult<TaskDto>>>();
        var secondPage = await (await SendWithDemoSessionAsync(
                HttpMethod.Get, "/api/tasks?pageSize=5&page=2", session.SessionId))
            .Content.ReadFromJsonAsync<ApiResult<PagedResult<TaskDto>>>();

        var firstIds = firstPage!.Data!.Items.Select(t => t.Id);
        var secondIds = secondPage!.Data!.Items.Select(t => t.Id);
        secondIds.Should().NotIntersectWith(firstIds);
    }

    [Fact]
    public async Task GetTasks_PageSizeIsClampedToMax()
    {
        var session = await CreateDemoSession();

        var body = await (await SendWithDemoSessionAsync(
                HttpMethod.Get, "/api/tasks?pageSize=5000", session.SessionId))
            .Content.ReadFromJsonAsync<ApiResult<PagedResult<TaskDto>>>();
        body!.Data!.PageSize.Should().Be(100);
    }

    [Fact]
    public async Task GetActivity_PageSizeIsClampedToActivityMax()
    {
        var session = await CreateDemoSession();

        var body = await (await SendWithDemoSessionAsync(
                HttpMethod.Get, "/api/activity?pageSize=9999", session.SessionId))
            .Content.ReadFromJsonAsync<ApiResult<PagedResult<AuditLogDto>>>();
        body!.Data!.PageSize.Should().Be(200);
    }

    [Fact]
    public async Task GetActivity_LegacyLimitParam_ActsAsPageSize()
    {
        var session = await CreateDemoSession();

        var body = await (await SendWithDemoSessionAsync(
                HttpMethod.Get, "/api/activity?limit=5", session.SessionId))
            .Content.ReadFromJsonAsync<ApiResult<PagedResult<AuditLogDto>>>();
        body!.Data!.PageSize.Should().Be(5);
        body.Data.Items.Should().HaveCount(5);
    }
}
