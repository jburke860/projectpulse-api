namespace ProjectPulse.Application.Tasks.Dtos;

public record LabelDto(Guid Id, string Name, string Color);

public record TaskDto(
    Guid Id,
    Guid ProjectId,
    string Title,
    string? Description,
    string Status,
    string Priority,
    DateTime? DueDateUtc,
    Guid? AssigneeId,
    string? AssigneeName,
    DateTime CreatedAtUtc,
    IReadOnlyList<LabelDto> Labels);

public record CreateTaskRequest(
    Guid ProjectId,
    string Title,
    string? Description,
    string Priority,
    Guid AssigneeId,
    DateTime? DueDateUtc);

public record UpdateTaskRequest(
    string Title,
    string? Description,
    string Priority,
    DateTime? DueDateUtc);

public record ChangeTaskStatusRequest(string Status);
public record AssignTaskRequest(Guid? AssigneeId);
public record AddCommentRequest(string Body);
public record AddLabelRequest(string Name, string Color);
public record AttachLabelRequest(Guid LabelId);
