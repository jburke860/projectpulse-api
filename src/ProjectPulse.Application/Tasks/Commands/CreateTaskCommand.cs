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
        RuleFor(x => x.Request.AssigneeId).NotEmpty();
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
        var assigneeName = await GetProjectMemberDisplayName(command.Request.ProjectId, command.Request.AssigneeId, cancellationToken);
        var projectName = await _db.Projects
            .Where(p => p.Id == command.Request.ProjectId)
            .Select(p => p.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;

        var priority = Enum.Parse<TaskPriority>(command.Request.Priority, true);
        var task = new TaskItem(command.Request.ProjectId, command.Request.Title, command.Request.Description, priority, command.Request.DueDateUtc);
        task.Assign(command.Request.AssigneeId);
        _db.Tasks.Add(task);
        await _audit.LogAsync(task.ProjectId, task.Id, AuditAction.Created, nameof(TaskItem), $"Task '{task.Title}' created.", cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return Map(task, assigneeName, projectName: projectName);
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

    private async Task<string> GetProjectMemberDisplayName(Guid projectId, Guid assigneeId, CancellationToken cancellationToken)
    {
        var assigneeName = await _db.ProjectMembers
            .Where(m => m.ProjectId == projectId && m.UserId == assigneeId && m.Role != ProjectRole.Viewer)
            .Select(m => m.User.DisplayName)
            .FirstOrDefaultAsync(cancellationToken);

        if (assigneeName is null)
        {
            throw new Common.Exceptions.ValidationException(new Dictionary<string, string[]>
            {
                ["assigneeId"] = ["Assignee must be an Admin or Member on the project."]
            });
        }

        return assigneeName;
    }

    internal static TaskDto Map(TaskItem task, string? assigneeName, string? lastEditedByName = null, string? projectName = null) =>
        new(task.Id, task.ProjectId, projectName ?? task.Project?.Name ?? string.Empty,
            task.Title, task.Description, task.Status.ToString(), task.Priority.ToString(),
            task.DueDateUtc, task.AssigneeId, assigneeName, task.CreatedAtUtc,
            task.TaskLabels
                .Where(tl => tl.Label != null)
                .Select(tl => new LabelDto(tl.LabelId, tl.Label.Name, tl.Label.Color))
                .OrderBy(l => l.Name)
                .ToList(),
            task.Attachments.Count,
            task.Attachments
                .OrderByDescending(a => a.CreatedAtUtc)
                .Select(a => a.FileName)
                .ToList(),
            task.UpdatedAtUtc,
            lastEditedByName);
}
