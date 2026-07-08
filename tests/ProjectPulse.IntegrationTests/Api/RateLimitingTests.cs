using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using ProjectPulse.Application.Common.Models;

namespace ProjectPulse.IntegrationTests.Api;

public class LowRateLimitWebApplicationFactory : CustomWebApplicationFactory
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.UseSetting("RateLimiting:DemoSessions:PermitLimit", "2");
        builder.UseSetting("RateLimiting:DemoSessions:WindowSeconds", "60");
    }
}

public class RateLimitingTests : IClassFixture<LowRateLimitWebApplicationFactory>
{
    private readonly HttpClient _client;

    public RateLimitingTests(LowRateLimitWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task DemoSessionCreation_BeyondLimit_Returns429WithApiEnvelope()
    {
        var first = await _client.PostAsync("/api/demo/sessions", null);
        var second = await _client.PostAsync("/api/demo/sessions", null);
        var third = await _client.PostAsync("/api/demo/sessions", null);

        first.StatusCode.Should().Be(HttpStatusCode.OK);
        second.StatusCode.Should().Be(HttpStatusCode.OK);
        third.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);

        var body = await third.Content.ReadFromJsonAsync<ApiResult<object>>();
        body!.Success.Should().BeFalse();
        body.Errors.Should().NotBeEmpty();
    }
}
