using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Tasks.Dtos;
using ProjectPulse.Domain.Entities;
using ProjectPulse.Domain.Enums;
using ProjectPulse.Domain.Rules;

namespace ProjectPulse.Application.Tasks.Commands;

public record UploadAttachmentCommand(
    Guid TaskId,
    string FileName,
    string ContentType,
    long SizeBytes,
    Stream Content) : IRequest<AttachmentDto>;

public class UploadAttachmentCommandValidator : AbstractValidator<UploadAttachmentCommand>
{
    public const long MaxSizeBytes = 5 * 1024 * 1024;

    public static readonly string[] AllowedExtensions =
        [".png", ".jpg", ".jpeg", ".gif", ".pdf", ".txt", ".md", ".csv", ".json", ".xlsx", ".docx", ".zip"];

    public UploadAttachmentCommandValidator()
    {
        RuleFor(x => x.TaskId).NotEmpty();
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(260);
        RuleFor(x => x.SizeBytes)
            .GreaterThan(0)
            .WithMessage("Attachment file is empty.")
            .LessThanOrEqualTo(MaxSizeBytes)
            .WithMessage("Attachment must be 5 MB or smaller.");
        RuleFor(x => x.FileName)
            .Must(name => AllowedExtensions.Contains(Path.GetExtension(name), StringComparer.OrdinalIgnoreCase))
            .WithMessage($"Attachment type is not allowed. Allowed types: {string.Join(", ", AllowedExtensions)}.");
    }
}

public class UploadAttachmentCommandHandler : IRequestHandler<UploadAttachmentCommand, AttachmentDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;
    private readonly IFileStorageService _storage;

    public UploadAttachmentCommandHandler(
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

    public async Task<AttachmentDto> Handle(UploadAttachmentCommand command, CancellationToken cancellationToken)
    {
        var task = await _db.Tasks
            .FirstOrDefaultAsync(t => t.Id == command.TaskId, cancellationToken)
            ?? throw new NotFoundException($"Task {command.TaskId} was not found.");

        var role = await _db.ProjectMembers
            .Where(m => m.ProjectId == task.ProjectId && m.UserId == _currentUser.UserId)
            .Select(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);
        ProjectMembershipRules.EnsureCanManageTasks(role);

        var safeFileName = Path.GetFileName(command.FileName);
        var storageKey = await _storage.SaveAsync(task.Id, safeFileName, command.Content, cancellationToken);

        var attachment = new Attachment(task.Id, safeFileName, command.ContentType, command.SizeBytes, storageKey);
        _db.Attachments.Add(attachment);
        await _audit.LogAsync(task.ProjectId, task.Id, AuditAction.Created, nameof(Attachment),
            $"Attachment '{safeFileName}' uploaded to task '{task.Title}'.", cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return new AttachmentDto(attachment.Id, attachment.TaskId, attachment.ProjectId, attachment.FileName, attachment.ContentType,
            attachment.SizeBytes, attachment.CreatedAtUtc);
    }
}
