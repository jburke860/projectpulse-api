using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Infrastructure.Persistence;
using ProjectPulse.Infrastructure.Services;

namespace ProjectPulse.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Data Source=projectpulse.db";

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlite(connectionString));

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<IAuditService, AuditService>();
        services.AddSingleton<ICurrentUserService, DevCurrentUserService>();

        return services;
    }
}
