namespace ProjectPulse.Application.Projects.Dtos;

public record ProjectDto(Guid Id, string Name, string? Description, DateTime CreatedAtUtc, int MemberCount, int TaskCount);
public record ProjectSummaryDto(Guid Id, string Name, int TotalTasks, int OpenTasks, int InProgressTasks, int DoneTasks, int OverdueTasks);
public record CreateProjectRequest(string Name, string? Description);
public record UpdateProjectRequest(string Name, string? Description);
public record AddProjectMemberRequest(Guid UserId, string Role);
