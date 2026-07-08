using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Files;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Extensions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Tasks.Dtos;

namespace ProjectPulse.Application.Projects.Queries;

public record DownloadProjectAttachmentQuery(Guid ProjectId, Guid AttachmentId) : IRequest<AttachmentDownloadDto>;

public class DownloadProjectAttachmentQueryHandler : IRequestHandler<DownloadProjectAttachmentQuery, AttachmentDownloadDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IFileStorageService _storage;

    public DownloadProjectAttachmentQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser, IFileStorageService storage)
    {
        _db = db;
        _currentUser = currentUser;
        _storage = storage;
    }

    public async Task<AttachmentDownloadDto> Handle(DownloadProjectAttachmentQuery query, CancellationToken cancellationToken)
    {
        var attachment = await _db.Attachments.AsNoTracking()
            .Where(a => a.Id == query.AttachmentId && a.ProjectId == query.ProjectId)
            .VisibleTo(_currentUser.UserId)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException($"Attachment {query.AttachmentId} was not found.");

        var content = await _storage.OpenReadAsync(attachment.StorageKey, cancellationToken);
        if (content is null && DemoAttachmentContent.IsDemoStorageKey(attachment.StorageKey))
        {
            return DemoAttachmentContent.Create(attachment.FileName, attachment.ContentType);
        }

        if (content is null)
        {
            throw new NotFoundException($"Attachment {query.AttachmentId} has no stored file.");
        }

        return new AttachmentDownloadDto(attachment.FileName, attachment.ContentType, content);
    }
}
