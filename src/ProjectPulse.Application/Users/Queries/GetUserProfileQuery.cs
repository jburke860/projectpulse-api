using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Audit.Dtos;
using ProjectPulse.Application.Common.Constants;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Extensions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Users.Dtos;
using TaskStatus = ProjectPulse.Domain.Enums.TaskStatus;

namespace ProjectPulse.Application.Users.Queries;

public record GetUserProfileQuery(Guid Id) : IRequest<UserProfileDto>;

public class GetUserProfileQueryHandler : IRequestHandler<GetUserProfileQuery, UserProfileDto>
{
    public const int RecentActivityCount = 8;

    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetUserProfileQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<UserProfileDto> Handle(GetUserProfileQuery query, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUser.UserId;

        var user = await _db.Users.AsNoTracking()
            .VisibleTo(currentUserId)
            .Where(u => u.Id == query.Id)
            .Select(u => new { u.Id, u.DisplayName, u.Email, u.AvatarColor, u.CreatedAtUtc })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException($"User {query.Id} was not found.");

        // Memberships, tasks, and activity are all scoped to projects the
        // current session can see, matching the isolation in GetUsersQuery.
        var memberships = await _db.ProjectMembers.AsNoTracking()
            .VisibleTo(currentUserId)
            .Where(m => m.UserId == query.Id)
            .OrderBy(m => m.Project.Name)
            .Select(m => new UserProfileMembershipDto(
                m.ProjectId,
                m.Project.Name,
                m.Project.Status.ToString(),
                m.Role.ToString(),
                m.Project.Icon,
                m.Project.Color))
            .ToListAsync(cancellationToken);

        var assignedTasks = _db.Tasks.AsNoTracking()
            .VisibleTo(currentUserId)
            .Where(t => t.AssigneeId == query.Id);

        var today = DateTime.UtcNow.Date;
        var activeCount = await assignedTasks.CountAsync(
            t => t.Status != TaskStatus.Done && t.Status != TaskStatus.Cancelled,
            cancellationToken);
        var completedCount = await assignedTasks.CountAsync(
            t => t.Status == TaskStatus.Done,
            cancellationToken);
        var overdueCount = await assignedTasks.CountAsync(
            t => t.Status != TaskStatus.Done && t.Status != TaskStatus.Cancelled &&
                 t.DueDateUtc != null && t.DueDateUtc < today,
            cancellationToken);

        var recentActivity = await _db.AuditLogs.AsNoTracking()
            .VisibleTo(currentUserId)
            .Where(a => a.ActorId == query.Id)
            .OrderByDescending(a => a.CreatedAtUtc)
            .Take(RecentActivityCount)
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

        return new UserProfileDto(
            user.Id,
            user.DisplayName,
            DemoSessionConstants.PublicDemoEmail(user.Email),
            user.AvatarColor,
            user.CreatedAtUtc,
            activeCount,
            completedCount,
            overdueCount,
            memberships,
            recentActivity);
    }
}
