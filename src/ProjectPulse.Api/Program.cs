using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using ProjectPulse.Api.Middleware;
using ProjectPulse.Api.Services;
using ProjectPulse.Application;
using ProjectPulse.Application.Common.Constants;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Infrastructure;
using ProjectPulse.Infrastructure.Persistence;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, configuration) =>
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .WriteTo.Console());

builder.WebHost.ConfigureKestrel(options =>
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, HeaderCurrentUserService>();
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? ["http://localhost:5173"];

    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});
builder.Services.AddRateLimiter(options =>
{
    var globalPermitLimit = builder.Configuration.GetValue("RateLimiting:Global:PermitLimit", 100);
    var globalWindowSeconds = builder.Configuration.GetValue("RateLimiting:Global:WindowSeconds", 60);
    var demoPermitLimit = builder.Configuration.GetValue("RateLimiting:DemoSessions:PermitLimit", 5);
    var demoWindowSeconds = builder.Configuration.GetValue("RateLimiting:DemoSessions:WindowSeconds", 60);

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(
            ApiResult<object>.Fail(["Too many requests. Wait a moment and try again."], "Rate limit exceeded"),
            cancellationToken);
    };

    // Partition by demo session so one visitor cannot exhaust another's budget; fall back to IP.
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Request.Headers[DemoSessionConstants.HeaderName].FirstOrDefault()
                ?? context.Connection.RemoteIpAddress?.ToString()
                ?? "anonymous",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = globalPermitLimit,
                Window = TimeSpan.FromSeconds(globalWindowSeconds),
                QueueLimit = 0
            }));

    options.AddPolicy("demo-session-create", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = demoPermitLimit,
                Window = TimeSpan.FromSeconds(demoWindowSeconds),
                QueueLimit = 0
            }));
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "ProjectPulse API", Version = "v1" });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await SeedData.InitializeAsync(db);
}

// Render terminates TLS at its proxy; trust X-Forwarded-* so scheme and client IP are correct.
var forwardedHeadersOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
};
forwardedHeadersOptions.KnownNetworks.Clear();
forwardedHeadersOptions.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedHeadersOptions);

if (app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

app.UseSerilogRequestLogging();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("Frontend");
app.UseRateLimiter();

if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();
app.MapGet("/", () => Results.Redirect("/swagger"));

app.Run();

public partial class Program;
