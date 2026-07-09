using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Extensions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Tasks.Commands;
using ProjectPulse.Application.Tasks.Dtos;
using ProjectPulse.Domain.Enums;

namespace ProjectPulse.Application.Tasks.Queries;

public record GetTaskByIdQuery(Guid Id) : IRequest<TaskDto>;

public class GetTaskByIdQueryHandler : IRequestHandler<GetTaskByIdQuery, TaskDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetTaskByIdQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<TaskDto> Handle(GetTaskByIdQuery query, CancellationToken cancellationToken)
    {
        var task = await _db.Tasks.AsNoTracking()
            .Include(t => t.Assignee)
            .Include(t => t.TaskLabels).ThenInclude(tl => tl.Label)
            .Include(t => t.Attachments)
            .VisibleTo(_currentUser.UserId)
            .FirstOrDefaultAsync(t => t.Id == query.Id, cancellationToken)
            ?? throw new NotFoundException($"Task {query.Id} was not found.");

        string? lastEditedByName = null;
        if (task.UpdatedAtUtc.HasValue)
        {
            lastEditedByName = await _db.AuditLogs.AsNoTracking()
                .Where(a => a.TaskId == task.Id &&
                    (a.Action == AuditAction.Updated ||
                        a.Action == AuditAction.StatusChanged ||
                        a.Action == AuditAction.Assigned))
                .OrderByDescending(a => a.CreatedAtUtc)
                .Select(a => a.Actor.DisplayName)
                .FirstOrDefaultAsync(cancellationToken);
        }

        return CreateTaskCommandHandler.Map(task, task.Assignee?.DisplayName, lastEditedByName);
    }
}
