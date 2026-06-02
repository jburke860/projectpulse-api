using ProjectPulse.Application.Audit.Dtos;

namespace ProjectPulse.Application.Dashboard.Dtos;

public record DashboardDto(
    int TotalProjects,
    int OpenTasks,
    int CompletedTasks,
    int OverdueTasks,
    IReadOnlyList<AuditLogDto> RecentActivity);
