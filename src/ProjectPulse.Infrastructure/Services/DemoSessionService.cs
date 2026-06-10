using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Constants;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Demo.Dtos;
using ProjectPulse.Infrastructure.Persistence;

namespace ProjectPulse.Infrastructure.Services;

public class DemoSessionService : IDemoSessionService
{
    private readonly ApplicationDbContext _db;

    public DemoSessionService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<DemoSessionDto> CreateAsync(CancellationToken cancellationToken = default)
    {
        await CleanupExpiredSessionsAsync(cancellationToken);

        var sessionId = Guid.NewGuid();
        await SeedData.SeedDemoWorkspaceAsync(_db, sessionId, cancellationToken);

        return await BuildSessionDtoAsync(sessionId, cancellationToken);
    }

    public async Task<DemoSessionDto> ResetAsync(Guid sessionId, CancellationToken cancellationToken = default)
    {
        if (sessionId == Guid.Empty || sessionId == SeedData.DemoAdminUserId)
        {
            sessionId = Guid.NewGuid();
        }

        await ClearSessionAsync(sessionId, cancellationToken);
        await SeedData.SeedDemoWorkspaceAsync(_db, sessionId, cancellationToken);

        return await BuildSessionDtoAsync(sessionId, cancellationToken);
    }

    private async Task<DemoSessionDto> BuildSessionDtoAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        var createdAtUtc = await _db.Users.AsNoTracking()
            .Where(u => u.Id == sessionId)
            .Select(u => u.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (createdAtUtc == default)
        {
            createdAtUtc = DateTime.UtcNow;
        }

        return new DemoSessionDto(
            sessionId.ToString("D"),
            sessionId,
            createdAtUtc.AddHours(DemoSessionConstants.LifetimeHours));
    }

    private async Task CleanupExpiredSessionsAsync(CancellationToken cancellationToken)
    {
        var cutoffUtc = DateTime.UtcNow.AddHours(-DemoSessionConstants.LifetimeHours);
        var adminEmailSuffix = $".admin@{DemoSessionConstants.EmailDomain}";
        var expiredSessionIds = await _db.Users.AsNoTracking()
            .Where(u =>
                u.CreatedAtUtc < cutoffUtc &&
                u.Email.StartsWith(DemoSessionConstants.EmailPrefix) &&
                u.Email.EndsWith(adminEmailSuffix))
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);

        foreach (var sessionId in expiredSessionIds)
        {
            await ClearSessionAsync(sessionId, cancellationToken);
        }
    }

    private async Task ClearSessionAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        var projectIds = await _db.ProjectMembers.AsNoTracking()
            .Where(m => m.UserId == sessionId)
            .Select(m => m.ProjectId)
            .ToListAsync(cancellationToken);

        if (projectIds.Count > 0)
        {
            var projects = await _db.Projects
                .Where(p => projectIds.Contains(p.Id))
                .ToListAsync(cancellationToken);

            _db.Projects.RemoveRange(projects);
            await _db.SaveChangesAsync(cancellationToken);
        }

        var emailPrefix = DemoSessionConstants.EmailSessionPrefix(sessionId);
        var users = await _db.Users
            .Where(u => u.Email.StartsWith(emailPrefix))
            .ToListAsync(cancellationToken);

        if (users.Count > 0)
        {
            _db.Users.RemoveRange(users);
            await _db.SaveChangesAsync(cancellationToken);
        }
    }
}
