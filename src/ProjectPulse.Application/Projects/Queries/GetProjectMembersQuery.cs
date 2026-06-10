using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Extensions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Projects.Dtos;

namespace ProjectPulse.Application.Projects.Queries;

public record GetProjectMembersQuery(Guid ProjectId) : IRequest<IReadOnlyList<ProjectMemberDto>>;

public class GetProjectMembersQueryHandler : IRequestHandler<GetProjectMembersQuery, IReadOnlyList<ProjectMemberDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetProjectMembersQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<ProjectMemberDto>> Handle(GetProjectMembersQuery query, CancellationToken cancellationToken) =>
        await _db.ProjectMembers.AsNoTracking()
            .VisibleTo(_currentUser.UserId)
            .Where(m => m.ProjectId == query.ProjectId)
            .Select(m => new ProjectMemberDto(
                m.UserId,
                m.User.DisplayName,
                m.User.Email,
                m.Role.ToString()))
            .ToListAsync(cancellationToken);
}
