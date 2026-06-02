using ProjectPulse.Domain.Common;
using ProjectPulse.Domain.Enums;

namespace ProjectPulse.Domain.Entities;

public class AuditLog : BaseEntity
{
    public Guid ProjectId { get; private set; }
    public Project Project { get; private set; } = null!;
    public Guid? TaskId { get; private set; }
    public Guid ActorId { get; private set; }
    public User Actor { get; private set; } = null!;
    public AuditAction Action { get; private set; }
    public string EntityType { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;

    private AuditLog()
    {
    }

    public AuditLog(Guid projectId, Guid? taskId, Guid actorId, AuditAction action, string entityType, string message)
    {
        ProjectId = projectId;
        TaskId = taskId;
        ActorId = actorId;
        Action = action;
        EntityType = entityType;
        Message = message;
    }
}
