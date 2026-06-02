using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Tasks.Commands;
using ProjectPulse.Application.Tasks.Dtos;

namespace ProjectPulse.Application.Tasks.Queries;

public record GetTaskByIdQuery(Guid Id) : IRequest<TaskDto>;

public class GetTaskByIdQueryHandler : IRequestHandler<GetTaskByIdQuery, TaskDto>
{
    private readonly IApplicationDbContext _db;

    public GetTaskByIdQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<TaskDto> Handle(GetTaskByIdQuery query, CancellationToken cancellationToken)
    {
        var task = await _db.Tasks.AsNoTracking()
            .Include(t => t.Assignee)
            .FirstOrDefaultAsync(t => t.Id == query.Id, cancellationToken)
            ?? throw new NotFoundException($"Task {query.Id} was not found.");

        return CreateTaskCommandHandler.Map(task, task.Assignee?.DisplayName);
    }
}
