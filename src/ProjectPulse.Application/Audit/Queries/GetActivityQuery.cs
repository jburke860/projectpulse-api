using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Audit.Dtos;
using ProjectPulse.Application.Common.Interfaces;

namespace ProjectPulse.Application.Audit.Queries;

public record GetActivityQuery(int Limit = 50) : IRequest<IReadOnlyList<AuditLogDto>>;

public class GetActivityQueryHandler : IRequestHandler<GetActivityQuery, IReadOnlyList<AuditLogDto>>
{
    private readonly IApplicationDbContext _db;

    public GetActivityQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<AuditLogDto>> Handle(GetActivityQuery query, CancellationToken cancellationToken) =>
        await _db.AuditLogs.AsNoTracking()
            .OrderByDescending(a => a.CreatedAtUtc)
            .Take(query.Limit)
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
