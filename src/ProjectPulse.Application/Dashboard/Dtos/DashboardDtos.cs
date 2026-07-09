using ProjectPulse.Application.Audit.Dtos;

namespace ProjectPulse.Application.Dashboard.Dtos;

public record StatusCountDto(string Status, int Count);

public record DashboardDto(
    int TotalProjects,
    int OpenTasks,
    int CompletedTasks,
    int OverdueTasks,
    int TeamMemberCount,
    int TotalTasks,
    IReadOnlyList<StatusCountDto> TasksByStatus,
    IReadOnlyList<StatusCountDto> ProjectsByStatus,
    IReadOnlyList<AuditLogDto> RecentActivity);
