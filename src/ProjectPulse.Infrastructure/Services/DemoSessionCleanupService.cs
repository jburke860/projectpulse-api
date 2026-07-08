using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ProjectPulse.Application.Common.Interfaces;

namespace ProjectPulse.Infrastructure.Services;

public class DemoSessionCleanupService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DemoSessionCleanupService> _logger;

    public DemoSessionCleanupService(IServiceScopeFactory scopeFactory, ILogger<DemoSessionCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // The first tick fires after one interval, so cleanup never races startup seeding.
        using var timer = new PeriodicTimer(Interval);

        while (await WaitForNextTickSafelyAsync(timer, stoppingToken))
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var sessions = scope.ServiceProvider.GetRequiredService<IDemoSessionService>();
                await sessions.CleanupExpiredSessionsAsync(stoppingToken);
                _logger.LogInformation("Expired demo session cleanup completed.");
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Expired demo session cleanup failed; will retry next interval.");
            }
        }
    }

    private static async Task<bool> WaitForNextTickSafelyAsync(PeriodicTimer timer, CancellationToken stoppingToken)
    {
        try
        {
            return await timer.WaitForNextTickAsync(stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return false;
        }
    }
}
