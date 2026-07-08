using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Extensions;
using ProjectPulse.Application.Common.Interfaces;

namespace ProjectPulse.Application.Tasks.Queries;

public record AttachmentDownloadDto(string FileName, string ContentType, Stream Content);

public record DownloadAttachmentQuery(Guid TaskId, Guid AttachmentId) : IRequest<AttachmentDownloadDto>;

public class DownloadAttachmentQueryHandler : IRequestHandler<DownloadAttachmentQuery, AttachmentDownloadDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IFileStorageService _storage;

    public DownloadAttachmentQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser, IFileStorageService storage)
    {
        _db = db;
        _currentUser = currentUser;
        _storage = storage;
    }

    public async Task<AttachmentDownloadDto> Handle(DownloadAttachmentQuery query, CancellationToken cancellationToken)
    {
        var attachment = await _db.Attachments.AsNoTracking()
            .Where(a => a.Id == query.AttachmentId && a.TaskId == query.TaskId)
            .VisibleTo(_currentUser.UserId)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException($"Attachment {query.AttachmentId} was not found.");

        // Seeded demo attachments reference storage keys with no file on disk; treat those as not found.
        var content = await _storage.OpenReadAsync(attachment.StorageKey, cancellationToken)
            ?? throw new NotFoundException($"Attachment {query.AttachmentId} has no stored file.");

        return new AttachmentDownloadDto(attachment.FileName, attachment.ContentType, content);
    }
}
