using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Tasks.Dtos;
using ProjectPulse.Application.Tasks.Commands;
using ProjectPulse.Domain.Enums;
using TaskStatus = ProjectPulse.Domain.Enums.TaskStatus;
using TaskPriority = ProjectPulse.Domain.Enums.TaskPriority;

namespace ProjectPulse.Application.Tasks.Queries;

public record GetTasksQuery(
    Guid? ProjectId,
    string? Status,
    string? Priority,
    Guid? AssigneeId,
    DateTime? DueBeforeUtc) : IRequest<IReadOnlyList<TaskDto>>;

public class GetTasksQueryHandler : IRequestHandler<GetTasksQuery, IReadOnlyList<TaskDto>>
{
    private readonly IApplicationDbContext _db;

    public GetTasksQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<TaskDto>> Handle(GetTasksQuery query, CancellationToken cancellationToken)
    {
        var tasks = _db.Tasks.AsNoTracking().Include(t => t.Assignee).AsQueryable();

        if (query.ProjectId.HasValue)
        {
            tasks = tasks.Where(t => t.ProjectId == query.ProjectId);
        }

        if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<TaskStatus>(query.Status, true, out var status))
        {
            tasks = tasks.Where(t => t.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(query.Priority) && Enum.TryParse<TaskPriority>(query.Priority, true, out var priority))
        {
            tasks = tasks.Where(t => t.Priority == priority);
        }

        if (query.AssigneeId.HasValue)
        {
            tasks = tasks.Where(t => t.AssigneeId == query.AssigneeId);
        }

        if (query.DueBeforeUtc.HasValue)
        {
            tasks = tasks.Where(t => t.DueDateUtc != null && t.DueDateUtc <= query.DueBeforeUtc);
        }

        return await tasks
            .OrderByDescending(t => t.CreatedAtUtc)
            .Select(t => new TaskDto(
                t.Id,
                t.ProjectId,
                t.Title,
                t.Description,
                t.Status.ToString(),
                t.Priority.ToString(),
                t.DueDateUtc,
                t.AssigneeId,
                t.Assignee != null ? t.Assignee.DisplayName : null,
                t.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }
}
