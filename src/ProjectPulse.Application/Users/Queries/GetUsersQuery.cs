using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Constants;
using ProjectPulse.Application.Common.Extensions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Application.Users.Dtos;

namespace ProjectPulse.Application.Users.Queries;

public record GetUsersQuery(int? Page = null, int? PageSize = null) : IRequest<PagedResult<UserDto>>;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, PagedResult<UserDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetUsersQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<UserDto>> Handle(GetUsersQuery query, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId;
        var users = _db.Users.AsNoTracking()
            .VisibleTo(currentUserId);

        var (page, pageSize) = Paging.Clamp(query.Page, query.PageSize);
        var totalCount = await users.CountAsync(cancellationToken);

        // Counts are scoped to projects the current user can see, so shared
        // users never leak activity from other workspaces.
        var items = await users
            .OrderBy(u => u.DisplayName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserDto(
                u.Id,
                u.DisplayName,
                DemoSessionConstants.PublicDemoEmail(u.Email),
                u.Memberships.Count(m => m.Project.Members.Any(pm => pm.UserId == currentUserId)),
                u.AssignedTasks.Count(t =>
                    t.Status != Domain.Enums.TaskStatus.Done &&
                    t.Status != Domain.Enums.TaskStatus.Cancelled &&
                    t.Project.Members.Any(pm => pm.UserId == currentUserId)),
                u.AvatarColor))
            .ToListAsync(cancellationToken);

        return new PagedResult<UserDto>(items, totalCount, page, pageSize);
    }
}
