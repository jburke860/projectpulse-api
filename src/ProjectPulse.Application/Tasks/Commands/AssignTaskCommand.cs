using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Tasks.Dtos;
using ProjectPulse.Domain.Enums;
using ProjectPulse.Domain.Rules;

namespace ProjectPulse.Application.Tasks.Commands;

public record AssignTaskCommand(Guid TaskId, AssignTaskRequest Request) : IRequest<TaskDto>;

public class AssignTaskCommandHandler : IRequestHandler<AssignTaskCommand, TaskDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;

    public AssignTaskCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IAuditService audit)
    {
        _db = db;
        _currentUser = currentUser;
        _audit = audit;
    }

    public async Task<TaskDto> Handle(AssignTaskCommand command, CancellationToken cancellationToken)
    {
        var task = await _db.Tasks.Include(t => t.Assignee)
            .FirstOrDefaultAsync(t => t.Id == command.TaskId, cancellationToken)
            ?? throw new NotFoundException($"Task {command.TaskId} was not found.");

        var role = await _db.ProjectMembers
            .Where(m => m.ProjectId == task.ProjectId && m.UserId == _currentUser.UserId)
            .Select(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);
        ProjectMembershipRules.EnsureCanManageTasks(role);

        if (command.Request.AssigneeId.HasValue)
        {
            var isMember = await _db.ProjectMembers
                .AnyAsync(m => m.ProjectId == task.ProjectId && m.UserId == command.Request.AssigneeId, cancellationToken);
            if (!isMember)
            {
                throw new Common.Exceptions.ValidationException(new Dictionary<string, string[]>
                {
                    ["assigneeId"] = ["Assignee must be a project member."]
                });
            }
        }

        task.Assign(command.Request.AssigneeId);
        await _audit.LogAsync(task.ProjectId, task.Id, AuditAction.Assigned, nameof(Domain.Entities.TaskItem),
            command.Request.AssigneeId.HasValue ? $"Assigned to {command.Request.AssigneeId}." : "Unassigned.", cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        var assignee = command.Request.AssigneeId.HasValue
            ? await _db.Users.Where(u => u.Id == command.Request.AssigneeId).Select(u => u.DisplayName).FirstAsync(cancellationToken)
            : null;

        return CreateTaskCommandHandler.Map(task, assignee);
    }
}
