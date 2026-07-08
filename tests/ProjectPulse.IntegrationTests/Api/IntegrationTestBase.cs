using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using ProjectPulse.Application.Common.Constants;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Application.Demo.Dtos;
using ProjectPulse.Infrastructure.Persistence;

namespace ProjectPulse.IntegrationTests.Api;

public abstract class IntegrationTestBase : IClassFixture<CustomWebApplicationFactory>
{
    protected readonly CustomWebApplicationFactory Factory;
    protected readonly HttpClient Client;

    protected IntegrationTestBase(CustomWebApplicationFactory factory)
    {
        Factory = factory;
        Client = factory.CreateClient();

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        SeedData.InitializeAsync(db).GetAwaiter().GetResult();
    }

    protected async Task<DemoSessionDto> CreateDemoSession()
    {
        var response = await Client.PostAsync("/api/demo/sessions", null);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<ApiResult<DemoSessionDto>>();
        body!.Data.Should().NotBeNull();
        return body.Data!;
    }

    protected Task<HttpResponseMessage> SendWithDemoSessionAsync(
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

        return Client.SendAsync(request);
    }
}
