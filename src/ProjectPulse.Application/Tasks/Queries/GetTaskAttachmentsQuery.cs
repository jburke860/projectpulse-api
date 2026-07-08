using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Extensions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Tasks.Dtos;

namespace ProjectPulse.Application.Tasks.Queries;

public record GetTaskAttachmentsQuery(Guid TaskId) : IRequest<IReadOnlyList<AttachmentDto>>;

public class GetTaskAttachmentsQueryHandler : IRequestHandler<GetTaskAttachmentsQuery, IReadOnlyList<AttachmentDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetTaskAttachmentsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<AttachmentDto>> Handle(GetTaskAttachmentsQuery query, CancellationToken cancellationToken)
    {
        var taskVisible = await _db.Tasks
            .Where(t => t.Id == query.TaskId)
            .VisibleTo(_currentUser.UserId)
            .AnyAsync(cancellationToken);

        if (!taskVisible)
        {
            throw new NotFoundException($"Task {query.TaskId} was not found.");
        }

        return await _db.Attachments.AsNoTracking()
            .Where(a => a.TaskId == query.TaskId)
            .OrderByDescending(a => a.CreatedAtUtc)
            .Select(a => new AttachmentDto(a.Id, a.TaskId, a.FileName, a.ContentType, a.SizeBytes, a.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }
}
