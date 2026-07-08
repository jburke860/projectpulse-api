using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Extensions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Application.Projects.Dtos;

namespace ProjectPulse.Application.Projects.Queries;

public record GetProjectsQuery(int? Page = null, int? PageSize = null) : IRequest<PagedResult<ProjectDto>>;

public class GetProjectsQueryHandler : IRequestHandler<GetProjectsQuery, PagedResult<ProjectDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetProjectsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<ProjectDto>> Handle(GetProjectsQuery query, CancellationToken cancellationToken)
    {
        var projects = _db.Projects.AsNoTracking()
            .VisibleTo(_currentUser.UserId);

        var (page, pageSize) = Paging.Clamp(query.Page, query.PageSize);
        var totalCount = await projects.CountAsync(cancellationToken);

        var items = await projects
            .OrderByDescending(p => p.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProjectDto(
                p.Id,
                p.Name,
                p.Description,
                p.Status.ToString(),
                p.CreatedAtUtc,
                p.Members.Count,
                p.Tasks.Count))
            .ToListAsync(cancellationToken);

        return new PagedResult<ProjectDto>(items, totalCount, page, pageSize);
    }
}
