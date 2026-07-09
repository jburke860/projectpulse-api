using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Tasks.Dtos;
using ProjectPulse.Domain.Enums;
using ProjectPulse.Domain.Rules;
using TaskPriority = ProjectPulse.Domain.Enums.TaskPriority;

namespace ProjectPulse.Application.Tasks.Commands;

public record UpdateTaskCommand(Guid TaskId, UpdateTaskRequest Request) : IRequest<TaskDto>;

public class UpdateTaskCommandValidator : AbstractValidator<UpdateTaskCommand>
{
    public UpdateTaskCommandValidator()
    {
        RuleFor(x => x.Request.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Request.Priority).NotEmpty().Must(p => Enum.TryParse<TaskPriority>(p, true, out _));
    }
}

public class UpdateTaskCommandHandler : IRequestHandler<UpdateTaskCommand, TaskDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;

    public UpdateTaskCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IAuditService audit)
    {
        _db = db;
        _currentUser = currentUser;
        _audit = audit;
    }

    public async Task<TaskDto> Handle(UpdateTaskCommand command, CancellationToken cancellationToken)
    {
        var task = await _db.Tasks.Include(t => t.Assignee)
            .Include(t => t.TaskLabels).ThenInclude(tl => tl.Label)
            .Include(t => t.Attachments)
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == command.TaskId, cancellationToken)
            ?? throw new NotFoundException($"Task {command.TaskId} was not found.");

        var role = await _db.ProjectMembers
            .Where(m => m.ProjectId == task.ProjectId && m.UserId == _currentUser.UserId)
            .Select(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);
        ProjectMembershipRules.EnsureCanManageTasks(role);

        var priority = Enum.Parse<TaskPriority>(command.Request.Priority, true);
        task.Update(command.Request.Title, command.Request.Description, priority, command.Request.DueDateUtc);
        await _audit.LogAsync(task.ProjectId, task.Id, AuditAction.Updated, nameof(Domain.Entities.TaskItem), "Task updated.", cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return CreateTaskCommandHandler.Map(task, task.Assignee?.DisplayName);
    }
}
