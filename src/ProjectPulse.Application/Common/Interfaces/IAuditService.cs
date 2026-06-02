using ProjectPulse.Domain.Enums;

namespace ProjectPulse.Application.Common.Interfaces;

public interface IAuditService
{
    Task LogAsync(Guid projectId, Guid? taskId, AuditAction action, string entityType, string message, CancellationToken cancellationToken = default);
}
