namespace ProjectPulse.Application.Audit.Dtos;

public record AuditLogDto(
    Guid Id,
    Guid ProjectId,
    Guid? TaskId,
    Guid ActorId,
    string ActorName,
    string Action,
    string EntityType,
    string Message,
    DateTime CreatedAtUtc);
