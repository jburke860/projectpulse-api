using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Tasks.Commands;

namespace ProjectPulse.Application.Tasks.Queries;

public record GetTaskCommentsQuery(Guid TaskId) : IRequest<IReadOnlyList<CommentDto>>;

public class GetTaskCommentsQueryHandler : IRequestHandler<GetTaskCommentsQuery, IReadOnlyList<CommentDto>>
{
    private readonly IApplicationDbContext _db;

    public GetTaskCommentsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<CommentDto>> Handle(GetTaskCommentsQuery query, CancellationToken cancellationToken) =>
        await _db.Comments.AsNoTracking()
            .Where(c => c.TaskId == query.TaskId)
            .OrderByDescending(c => c.CreatedAtUtc)
            .Select(c => new CommentDto(
                c.Id,
                c.TaskId,
                c.AuthorId,
                c.Author.DisplayName,
                c.Body,
                c.CreatedAtUtc))
            .ToListAsync(cancellationToken);
}
