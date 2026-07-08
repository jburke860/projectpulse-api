using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Extensions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Common.Models;
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
    DateTime? DueBeforeUtc,
    int? Page = null,
    int? PageSize = null) : IRequest<PagedResult<TaskDto>>;

public class GetTasksQueryHandler : IRequestHandler<GetTasksQuery, PagedResult<TaskDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetTasksQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<TaskDto>> Handle(GetTasksQuery query, CancellationToken cancellationToken)
    {
        var tasks = _db.Tasks.AsNoTracking()
            .Include(t => t.Assignee)
            .VisibleTo(_currentUser.UserId);

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

        var (page, pageSize) = Paging.Clamp(query.Page, query.PageSize);
        var totalCount = await tasks.CountAsync(cancellationToken);

        var items = await tasks
            .OrderByDescending(t => t.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
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
                t.CreatedAtUtc,
                t.TaskLabels
                    .OrderBy(tl => tl.Label.Name)
                    .Select(tl => new LabelDto(tl.LabelId, tl.Label.Name, tl.Label.Color))
                    .ToList()))
            .ToListAsync(cancellationToken);

        return new PagedResult<TaskDto>(items, totalCount, page, pageSize);
    }
}
