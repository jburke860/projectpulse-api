using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Audit.Dtos;
using ProjectPulse.Application.Common.Interfaces;

namespace ProjectPulse.Application.Audit.Queries;

public record GetProjectActivityQuery(Guid ProjectId) : IRequest<IReadOnlyList<AuditLogDto>>;

public class GetProjectActivityQueryHandler : IRequestHandler<GetProjectActivityQuery, IReadOnlyList<AuditLogDto>>
{
    private readonly IApplicationDbContext _db;

    public GetProjectActivityQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<AuditLogDto>> Handle(GetProjectActivityQuery query, CancellationToken cancellationToken) =>
        await _db.AuditLogs.AsNoTracking()
            .Where(a => a.ProjectId == query.ProjectId)
            .OrderByDescending(a => a.CreatedAtUtc)
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
}
