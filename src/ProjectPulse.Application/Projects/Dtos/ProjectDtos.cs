namespace ProjectPulse.Application.Projects.Dtos;

public record ProjectDto(Guid Id, string Name, string? Description, string Status, DateTime CreatedAtUtc, int MemberCount, int TaskCount, string? Icon = null, string? Color = null);
public record ProjectSummaryDto(Guid Id, string Name, int TotalTasks, int OpenTasks, int InProgressTasks, int DoneTasks, int OverdueTasks);
public record CreateProjectRequest(string Name, string? Description, string? Status = null, string? Icon = null, string? Color = null);
public record UpdateProjectRequest(string Name, string? Description, string Status);
public record AddProjectMemberRequest(Guid UserId, string Role);
