using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Tasks.Dtos;
using ProjectPulse.Domain.Entities;
using ProjectPulse.Domain.Enums;
using ProjectPulse.Domain.Rules;

namespace ProjectPulse.Application.Tasks.Commands;

public record DetachLabelCommand(Guid TaskId, Guid LabelId) : IRequest<TaskDto>;

public class DetachLabelCommandHandler : IRequestHandler<DetachLabelCommand, TaskDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;

    public DetachLabelCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IAuditService audit)
    {
        _db = db;
        _currentUser = currentUser;
        _audit = audit;
    }

    public async Task<TaskDto> Handle(DetachLabelCommand command, CancellationToken cancellationToken)
    {
        var task = await _db.Tasks
            .Include(t => t.Assignee)
            .Include(t => t.TaskLabels).ThenInclude(tl => tl.Label)
            .Include(t => t.Attachments)
            .FirstOrDefaultAsync(t => t.Id == command.TaskId, cancellationToken)
            ?? throw new NotFoundException($"Task {command.TaskId} was not found.");

        var role = await _db.ProjectMembers
            .Where(m => m.ProjectId == task.ProjectId && m.UserId == _currentUser.UserId)
            .Select(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);
        ProjectMembershipRules.EnsureCanManageTasks(role);

        var taskLabel = task.TaskLabels.FirstOrDefault(tl => tl.LabelId == command.LabelId)
            ?? throw new NotFoundException($"Label {command.LabelId} is not attached to task {command.TaskId}.");

        var labelName = taskLabel.Label?.Name ?? "label";
        _db.TaskLabels.Remove(taskLabel);
        task.TaskLabels.Remove(taskLabel);
        await _audit.LogAsync(task.ProjectId, task.Id, AuditAction.Updated, nameof(TaskLabel),
            $"Label '{labelName}' removed from task '{task.Title}'.", cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return CreateTaskCommandHandler.Map(task, task.Assignee?.DisplayName);
    }
}
