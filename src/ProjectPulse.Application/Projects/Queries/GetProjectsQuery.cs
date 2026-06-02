using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Projects.Dtos;

namespace ProjectPulse.Application.Projects.Queries;

public record GetProjectsQuery : IRequest<IReadOnlyList<ProjectDto>>;

public class GetProjectsQueryHandler : IRequestHandler<GetProjectsQuery, IReadOnlyList<ProjectDto>>
{
    private readonly IApplicationDbContext _db;

    public GetProjectsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<ProjectDto>> Handle(GetProjectsQuery query, CancellationToken cancellationToken) =>
        await _db.Projects.AsNoTracking()
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => new ProjectDto(
                p.Id,
                p.Name,
                p.Description,
                p.CreatedAtUtc,
                p.Members.Count,
                p.Tasks.Count))
            .ToListAsync(cancellationToken);
}
