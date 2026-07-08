using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Audit.Dtos;
using ProjectPulse.Application.Common.Extensions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Common.Models;

namespace ProjectPulse.Application.Audit.Queries;

public record GetActivityQuery(int? Page = null, int? PageSize = null) : IRequest<PagedResult<AuditLogDto>>;

public class GetActivityQueryHandler : IRequestHandler<GetActivityQuery, PagedResult<AuditLogDto>>
{
    public const int DefaultPageSize = 50;
    public const int MaxPageSize = 200;

    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetActivityQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<AuditLogDto>> Handle(GetActivityQuery query, CancellationToken cancellationToken)
    {
        var auditLogs = _db.AuditLogs.AsNoTracking()
            .VisibleTo(_currentUser.UserId);

        var (page, pageSize) = Paging.Clamp(query.Page, query.PageSize, DefaultPageSize, MaxPageSize);
        var totalCount = await auditLogs.CountAsync(cancellationToken);

        var items = await auditLogs
            .OrderByDescending(a => a.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
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

        return new PagedResult<AuditLogDto>(items, totalCount, page, pageSize);
    }
}
