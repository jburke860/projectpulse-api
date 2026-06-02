using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Audit.Dtos;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Dashboard.Dtos;
using TaskStatus = ProjectPulse.Domain.Enums.TaskStatus;

namespace ProjectPulse.Application.Dashboard.Queries;

public record GetDashboardQuery : IRequest<DashboardDto>;

public class GetDashboardQueryHandler : IRequestHandler<GetDashboardQuery, DashboardDto>
{
    private readonly IApplicationDbContext _db;

    public GetDashboardQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<DashboardDto> Handle(GetDashboardQuery query, CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;
        var tasks = _db.Tasks.AsNoTracking();

        var recentActivity = await _db.AuditLogs.AsNoTracking()
            .OrderByDescending(a => a.CreatedAtUtc)
            .Take(10)
            .Select(a => new AuditLogDto(
                a.Id,
                a.ProjectId,
                a.TaskId,
                a.ActorId,
                a.Actor.DisplayName,
                a.Action.ToString(),
                a.EntityType,
                a.Message,
                a.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return new DashboardDto(
            await _db.Projects.CountAsync(cancellationToken),
            await tasks.CountAsync(t => t.Status == TaskStatus.Open, cancellationToken),
            await tasks.CountAsync(t => t.Status == TaskStatus.Done, cancellationToken),
            await tasks.CountAsync(t => t.DueDateUtc != null && t.DueDateUtc < today && t.Status != TaskStatus.Done, cancellationToken),
            recentActivity);
    }
}
