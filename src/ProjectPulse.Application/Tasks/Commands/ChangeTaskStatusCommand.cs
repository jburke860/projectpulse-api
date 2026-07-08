using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Tasks.Dtos;
using ProjectPulse.Domain.Enums;
using ProjectPulse.Domain.Rules;
using TaskStatus = ProjectPulse.Domain.Enums.TaskStatus;

namespace ProjectPulse.Application.Tasks.Commands;

public record ChangeTaskStatusCommand(Guid TaskId, ChangeTaskStatusRequest Request) : IRequest<TaskDto>;

public class ChangeTaskStatusCommandValidator : AbstractValidator<ChangeTaskStatusCommand>
{
    public ChangeTaskStatusCommandValidator()
    {
        RuleFor(x => x.Request.Status).NotEmpty().Must(s => Enum.TryParse<TaskStatus>(s, true, out _));
    }
}

public class ChangeTaskStatusCommandHandler : IRequestHandler<ChangeTaskStatusCommand, TaskDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;

    public ChangeTaskStatusCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IAuditService audit)
    {
        _db = db;
        _currentUser = currentUser;
        _audit = audit;
    }

    public async Task<TaskDto> Handle(ChangeTaskStatusCommand command, CancellationToken cancellationToken)
    {
        var task = await _db.Tasks
            .Include(t => t.Assignee)
            .Include(t => t.TaskLabels).ThenInclude(tl => tl.Label)
            .FirstOrDefaultAsync(t => t.Id == command.TaskId, cancellationToken)
            ?? throw new NotFoundException($"Task {command.TaskId} was not found.");

        await EnsureCanManage(task.ProjectId, cancellationToken);

        var newStatus = Enum.Parse<TaskStatus>(command.Request.Status, true);
        var oldStatus = task.Status;
        task.ChangeStatus(newStatus);
        await _audit.LogAsync(task.ProjectId, task.Id, AuditAction.StatusChanged, nameof(Domain.Entities.TaskItem),
            $"Status changed from {oldStatus} to {newStatus}.", cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return CreateTaskCommandHandler.Map(task, task.Assignee?.DisplayName);
    }

    private async Task EnsureCanManage(Guid projectId, CancellationToken cancellationToken)
    {
        var role = await _db.ProjectMembers
            .Where(m => m.ProjectId == projectId && m.UserId == _currentUser.UserId)
            .Select(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);

        ProjectMembershipRules.EnsureCanManageTasks(role);
    }
}
