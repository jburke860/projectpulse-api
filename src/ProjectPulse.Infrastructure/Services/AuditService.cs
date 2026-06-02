using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Domain.Entities;
using ProjectPulse.Domain.Enums;

namespace ProjectPulse.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public AuditService(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public Task LogAsync(Guid projectId, Guid? taskId, AuditAction action, string entityType, string message, CancellationToken cancellationToken = default)
    {
        _db.AuditLogs.Add(new AuditLog(projectId, taskId, _currentUser.UserId, action, entityType, message));
        return Task.CompletedTask;
    }
}
