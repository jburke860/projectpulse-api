using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Extensions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Tasks.Dtos;

namespace ProjectPulse.Application.Projects.Queries;

public record GetProjectAttachmentsQuery(Guid ProjectId) : IRequest<IReadOnlyList<AttachmentDto>>;

public class GetProjectAttachmentsQueryHandler : IRequestHandler<GetProjectAttachmentsQuery, IReadOnlyList<AttachmentDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetProjectAttachmentsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<AttachmentDto>> Handle(GetProjectAttachmentsQuery query, CancellationToken cancellationToken)
    {
        var projectVisible = await _db.Projects
            .Where(p => p.Id == query.ProjectId)
            .VisibleTo(_currentUser.UserId)
            .AnyAsync(cancellationToken);

        if (!projectVisible)
        {
            throw new NotFoundException($"Project {query.ProjectId} was not found.");
        }

        return await _db.Attachments.AsNoTracking()
            .Where(a => a.ProjectId == query.ProjectId)
            .OrderByDescending(a => a.CreatedAtUtc)
            .Select(a => new AttachmentDto(a.Id, a.TaskId, a.ProjectId, a.FileName, a.ContentType, a.SizeBytes, a.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }
}
