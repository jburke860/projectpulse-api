using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Tasks.Dtos;
using ProjectPulse.Domain.Entities;
using ProjectPulse.Domain.Enums;
using ProjectPulse.Domain.Rules;

namespace ProjectPulse.Application.Tasks.Commands;

public record AttachLabelCommand(Guid TaskId, AttachLabelRequest Request) : IRequest<TaskDto>;

public class AttachLabelCommandValidator : AbstractValidator<AttachLabelCommand>
{
    public AttachLabelCommandValidator()
    {
        RuleFor(x => x.TaskId).NotEmpty();
        RuleFor(x => x.Request.LabelId).NotEmpty();
    }
}

public class AttachLabelCommandHandler : IRequestHandler<AttachLabelCommand, TaskDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;

    public AttachLabelCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IAuditService audit)
    {
        _db = db;
        _currentUser = currentUser;
        _audit = audit;
    }

    public async Task<TaskDto> Handle(AttachLabelCommand command, CancellationToken cancellationToken)
    {
        var task = await _db.Tasks
            .Include(t => t.Assignee)
            .Include(t => t.TaskLabels).ThenInclude(tl => tl.Label)
            .FirstOrDefaultAsync(t => t.Id == command.TaskId, cancellationToken)
            ?? throw new NotFoundException($"Task {command.TaskId} was not found.");

        var role = await _db.ProjectMembers
            .Where(m => m.ProjectId == task.ProjectId && m.UserId == _currentUser.UserId)
            .Select(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);
        ProjectMembershipRules.EnsureCanManageTasks(role);

        var label = await _db.Labels
            .FirstOrDefaultAsync(l => l.Id == command.Request.LabelId, cancellationToken)
            ?? throw new NotFoundException($"Label {command.Request.LabelId} was not found.");

        if (label.ProjectId != task.ProjectId)
        {
            throw new Common.Exceptions.ValidationException(new Dictionary<string, string[]>
            {
                ["labelId"] = ["Label must belong to the task's project."]
            });
        }

        if (task.TaskLabels.Any(tl => tl.LabelId == label.Id))
        {
            throw new Common.Exceptions.ValidationException(new Dictionary<string, string[]>
            {
                ["labelId"] = ["Label is already attached to this task."]
            });
        }

        var taskLabel = new TaskLabel(task.Id, label.Id);
        _db.TaskLabels.Add(taskLabel);
        await _audit.LogAsync(task.ProjectId, task.Id, AuditAction.Updated, nameof(TaskLabel),
            $"Label '{label.Name}' added to task '{task.Title}'.", cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return CreateTaskCommandHandler.Map(task, task.Assignee?.DisplayName);
    }
}
