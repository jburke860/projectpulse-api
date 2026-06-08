using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Domain.Entities;
using ProjectPulse.Domain.Enums;
using ProjectPulse.Domain.Rules;

namespace ProjectPulse.Application.Projects.Commands;

public record RemoveProjectMemberCommand(Guid ProjectId, Guid UserId) : IRequest<Unit>;

public class RemoveProjectMemberCommandHandler : IRequestHandler<RemoveProjectMemberCommand, Unit>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;

    public RemoveProjectMemberCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IAuditService audit)
    {
        _db = db;
        _currentUser = currentUser;
        _audit = audit;
    }

    public async Task<Unit> Handle(RemoveProjectMemberCommand command, CancellationToken cancellationToken)
    {
        var actorRole = await _db.ProjectMembers
            .Where(m => m.ProjectId == command.ProjectId && m.UserId == _currentUser.UserId)
            .Select(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);

        if (!ProjectMembershipRules.CanManageMembers(actorRole))
        {
            throw new Common.Exceptions.ValidationException(new Dictionary<string, string[]>
            {
                ["role"] = ["Only project admins can remove members."]
            });
        }

        var member = await _db.ProjectMembers
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.ProjectId == command.ProjectId && m.UserId == command.UserId, cancellationToken)
            ?? throw new NotFoundException($"Project member {command.UserId} was not found.");

        if (member.Role == ProjectRole.Admin)
        {
            var adminCount = await _db.ProjectMembers
                .CountAsync(m => m.ProjectId == command.ProjectId && m.Role == ProjectRole.Admin, cancellationToken);

            if (adminCount <= 1)
            {
                throw new Common.Exceptions.ValidationException(new Dictionary<string, string[]>
                {
                    ["userId"] = ["A project must keep at least one admin."]
                });
            }
        }

        var assignedTasks = await _db.Tasks
            .Where(t => t.ProjectId == command.ProjectId && t.AssigneeId == command.UserId)
            .ToListAsync(cancellationToken);

        foreach (var task in assignedTasks)
        {
            task.Assign(null);
        }

        _db.ProjectMembers.Remove(member);
        await _audit.LogAsync(command.ProjectId, null, AuditAction.MemberRemoved, nameof(ProjectMember),
            $"{member.User.DisplayName} removed from project.", cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
