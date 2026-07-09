namespace ProjectPulse.Application.Attachments.Dtos;

public record WorkspaceAttachmentDto(
    Guid Id,
    string FileName,
    string ContentType,
    long SizeBytes,
    DateTime CreatedAtUtc,
    Guid ProjectId,
    string ProjectName,
    Guid? TaskId,
    string? TaskTitle);
