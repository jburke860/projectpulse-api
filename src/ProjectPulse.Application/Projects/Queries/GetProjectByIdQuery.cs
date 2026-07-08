using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Extensions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Projects.Dtos;

namespace ProjectPulse.Application.Projects.Queries;

public record GetProjectByIdQuery(Guid Id) : IRequest<ProjectDto>;

public class GetProjectByIdQueryHandler : IRequestHandler<GetProjectByIdQuery, ProjectDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetProjectByIdQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<ProjectDto> Handle(GetProjectByIdQuery query, CancellationToken cancellationToken)
    {
        var project = await _db.Projects
            .AsNoTracking()
            .Where(p => p.Id == query.Id)
            .VisibleTo(_currentUser.UserId)
            .Select(p => new ProjectDto(
                p.Id,
                p.Name,
                p.Description,
                p.Status.ToString(),
                p.CreatedAtUtc,
                p.Members.Count,
                p.Tasks.Count))
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException($"Project {query.Id} was not found.");

        return project;
    }
}
