using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Projects.Dtos;
using TaskStatus = ProjectPulse.Domain.Enums.TaskStatus;

namespace ProjectPulse.Application.Projects.Queries;

public record GetProjectSummaryQuery(Guid ProjectId) : IRequest<ProjectSummaryDto>;

public class GetProjectSummaryQueryHandler : IRequestHandler<GetProjectSummaryQuery, ProjectSummaryDto>
{
    private readonly IApplicationDbContext _db;

    public GetProjectSummaryQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<ProjectSummaryDto> Handle(GetProjectSummaryQuery query, CancellationToken cancellationToken)
    {
        var project = await _db.Projects.AsNoTracking()
            .Where(p => p.Id == query.ProjectId)
            .Select(p => new { p.Id, p.Name })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException($"Project {query.ProjectId} was not found.");

        var tasks = _db.Tasks.AsNoTracking().Where(t => t.ProjectId == query.ProjectId);
        var now = DateTime.UtcNow.Date;

        return new ProjectSummaryDto(
            project.Id,
            project.Name,
            await tasks.CountAsync(cancellationToken),
            await tasks.CountAsync(t => t.Status == TaskStatus.Open, cancellationToken),
            await tasks.CountAsync(t => t.Status == TaskStatus.InProgress, cancellationToken),
            await tasks.CountAsync(t => t.Status == TaskStatus.Done, cancellationToken),
            await tasks.CountAsync(t => t.DueDateUtc != null && t.DueDateUtc < now && t.Status != TaskStatus.Done, cancellationToken));
    }
}
