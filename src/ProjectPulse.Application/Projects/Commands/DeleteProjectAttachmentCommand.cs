using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Domain.Entities;
using ProjectPulse.Domain.Enums;
using ProjectPulse.Domain.Rules;

namespace ProjectPulse.Application.Projects.Commands;

public record DeleteProjectAttachmentCommand(Guid ProjectId, Guid AttachmentId) : IRequest<Unit>;

public class DeleteProjectAttachmentCommandHandler : IRequestHandler<DeleteProjectAttachmentCommand, Unit>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;
    private readonly IFileStorageService _storage;

    public DeleteProjectAttachmentCommandHandler(
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

    public async Task<Unit> Handle(DeleteProjectAttachmentCommand command, CancellationToken cancellationToken)
    {
        var attachment = await _db.Attachments
            .FirstOrDefaultAsync(a => a.Id == command.AttachmentId && a.ProjectId == command.ProjectId, cancellationToken)
            ?? throw new NotFoundException($"Attachment {command.AttachmentId} was not found.");

        var role = await _db.ProjectMembers
            .Where(m => m.ProjectId == command.ProjectId && m.UserId == _currentUser.UserId)
            .Select(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);
        ProjectMembershipRules.EnsureCanManageTasks(role);

        _db.Attachments.Remove(attachment);
        await _audit.LogAsync(command.ProjectId, null, AuditAction.Deleted, nameof(Attachment),
            $"Project file '{attachment.FileName}' removed.", cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        await _storage.DeleteAsync(attachment.StorageKey, cancellationToken);
        return Unit.Value;
    }
}
