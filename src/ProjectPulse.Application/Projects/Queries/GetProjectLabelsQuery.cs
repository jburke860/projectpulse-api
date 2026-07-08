using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Extensions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Tasks.Dtos;

namespace ProjectPulse.Application.Projects.Queries;

public record GetProjectLabelsQuery(Guid ProjectId) : IRequest<IReadOnlyList<LabelDto>>;

public class GetProjectLabelsQueryHandler : IRequestHandler<GetProjectLabelsQuery, IReadOnlyList<LabelDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetProjectLabelsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<LabelDto>> Handle(GetProjectLabelsQuery query, CancellationToken cancellationToken)
    {
        var projectVisible = await _db.Projects
            .Where(p => p.Id == query.ProjectId)
            .VisibleTo(_currentUser.UserId)
            .AnyAsync(cancellationToken);

        if (!projectVisible)
        {
            throw new NotFoundException($"Project {query.ProjectId} was not found.");
        }

        return await _db.Labels.AsNoTracking()
            .Where(l => l.ProjectId == query.ProjectId)
            .OrderBy(l => l.Name)
            .Select(l => new LabelDto(l.Id, l.Name, l.Color))
            .ToListAsync(cancellationToken);
    }
}
