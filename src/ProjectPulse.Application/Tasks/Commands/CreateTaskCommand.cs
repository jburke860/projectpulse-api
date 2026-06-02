using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Tasks.Dtos;
using ProjectPulse.Domain.Entities;
using ProjectPulse.Domain.Enums;
using ProjectPulse.Domain.Rules;
using TaskItem = ProjectPulse.Domain.Entities.TaskItem;
using TaskPriority = ProjectPulse.Domain.Enums.TaskPriority;

namespace ProjectPulse.Application.Tasks.Commands;

public record CreateTaskCommand(CreateTaskRequest Request) : IRequest<TaskDto>;

public class CreateTaskCommandValidator : AbstractValidator<CreateTaskCommand>
{
    public CreateTaskCommandValidator()
    {
        RuleFor(x => x.Request.ProjectId).NotEmpty();
        RuleFor(x => x.Request.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Request.Priority).NotEmpty().Must(p => Enum.TryParse<TaskPriority>(p, true, out _));
    }
}

public class CreateTaskCommandHandler : IRequestHandler<CreateTaskCommand, TaskDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;

    public CreateTaskCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IAuditService audit)
    {
        _db = db;
        _currentUser = currentUser;
        _audit = audit;
    }

    public async Task<TaskDto> Handle(CreateTaskCommand command, CancellationToken cancellationToken)
    {
        await EnsureCanManageTasks(command.Request.ProjectId, cancellationToken);

        var priority = Enum.Parse<TaskPriority>(command.Request.Priority, true);
        var task = new TaskItem(command.Request.ProjectId, command.Request.Title, command.Request.Description, priority, command.Request.DueDateUtc);
        _db.Tasks.Add(task);
        await _audit.LogAsync(task.ProjectId, task.Id, AuditAction.Created, nameof(TaskItem), $"Task '{task.Title}' created.", cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return Map(task, null);
    }

    private async Task EnsureCanManageTasks(Guid projectId, CancellationToken cancellationToken)
    {
        var role = await _db.ProjectMembers
            .Where(m => m.ProjectId == projectId && m.UserId == _currentUser.UserId)
            .Select(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);

        if (!ProjectMembershipRules.CanManageTasks(role))
        {
            throw new Common.Exceptions.ValidationException(new Dictionary<string, string[]>
            {
                ["authorization"] = ["You are not allowed to manage tasks in this project."]
            });
        }
    }

    internal static TaskDto Map(TaskItem task, string? assigneeName) =>
        new(task.Id, task.ProjectId, task.Title, task.Description, task.Status.ToString(), task.Priority.ToString(),
            task.DueDateUtc, task.AssigneeId, assigneeName, task.CreatedAtUtc);
}
