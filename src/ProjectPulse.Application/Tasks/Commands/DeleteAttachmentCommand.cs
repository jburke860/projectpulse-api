using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Domain.Entities;
using ProjectPulse.Domain.Enums;
using ProjectPulse.Domain.Rules;

namespace ProjectPulse.Application.Tasks.Commands;

public record DeleteAttachmentCommand(Guid TaskId, Guid AttachmentId) : IRequest<Unit>;

public class DeleteAttachmentCommandHandler : IRequestHandler<DeleteAttachmentCommand, Unit>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;
    private readonly IFileStorageService _storage;

    public DeleteAttachmentCommandHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUser,
        IAuditService audit,
        IFileStorageService storage)
    {
        _db = db;
        _currentUser = currentUser;
        _audit = audit;
        _storage = storage;
    }

    public async Task<Unit> Handle(DeleteAttachmentCommand command, CancellationToken cancellationToken)
    {
        var attachment = await _db.Attachments
            .Include(a => a.Task)
            .FirstOrDefaultAsync(a => a.Id == command.AttachmentId && a.TaskId == command.TaskId, cancellationToken)
            ?? throw new NotFoundException($"Attachment {command.AttachmentId} was not found.");

        var role = await _db.ProjectMembers
            .Where(m => m.ProjectId == attachment.Task.ProjectId && m.UserId == _currentUser.UserId)
            .Select(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);
        ProjectMembershipRules.EnsureCanManageTasks(role);

        _db.Attachments.Remove(attachment);
        await _audit.LogAsync(attachment.Task.ProjectId, attachment.TaskId, AuditAction.Deleted, nameof(Attachment),
            $"Attachment '{attachment.FileName}' removed from task '{attachment.Task.Title}'.", cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        // Seeded demo attachments have no physical file; a missing file is not an error.
        await _storage.DeleteAsync(attachment.StorageKey, cancellationToken);

        return Unit.Value;
    }
}
