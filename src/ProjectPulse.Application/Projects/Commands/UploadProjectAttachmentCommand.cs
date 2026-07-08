using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Tasks.Commands;
using ProjectPulse.Application.Tasks.Dtos;
using ProjectPulse.Domain.Entities;
using ProjectPulse.Domain.Enums;
using ProjectPulse.Domain.Rules;

namespace ProjectPulse.Application.Projects.Commands;

public record UploadProjectAttachmentCommand(
    Guid ProjectId,
    string FileName,
    string ContentType,
    long SizeBytes,
    Stream Content) : IRequest<AttachmentDto>;

public class UploadProjectAttachmentCommandValidator : AbstractValidator<UploadProjectAttachmentCommand>
{
    public UploadProjectAttachmentCommandValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(260);
        RuleFor(x => x.SizeBytes)
            .GreaterThan(0)
            .WithMessage("Attachment file is empty.")
            .LessThanOrEqualTo(UploadAttachmentCommandValidator.MaxSizeBytes)
            .WithMessage("Attachment must be 5 MB or smaller.");
        RuleFor(x => x.FileName)
            .Must(name => UploadAttachmentCommandValidator.AllowedExtensions.Contains(
                Path.GetExtension(name),
                StringComparer.OrdinalIgnoreCase))
            .WithMessage($"Attachment type is not allowed. Allowed types: {string.Join(", ", UploadAttachmentCommandValidator.AllowedExtensions)}.");
    }
}

public class UploadProjectAttachmentCommandHandler : IRequestHandler<UploadProjectAttachmentCommand, AttachmentDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;
    private readonly IFileStorageService _storage;

    public UploadProjectAttachmentCommandHandler(
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

    public async Task<AttachmentDto> Handle(UploadProjectAttachmentCommand command, CancellationToken cancellationToken)
    {
        var project = await _db.Projects
            .FirstOrDefaultAsync(p => p.Id == command.ProjectId, cancellationToken)
            ?? throw new NotFoundException($"Project {command.ProjectId} was not found.");

        var role = await _db.ProjectMembers
            .Where(m => m.ProjectId == project.Id && m.UserId == _currentUser.UserId)
            .Select(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);
        ProjectMembershipRules.EnsureCanManageTasks(role);

        var safeFileName = Path.GetFileName(command.FileName);
        var storageKey = await _storage.SaveAsync(project.Id, safeFileName, command.Content, cancellationToken);

        var attachment = Attachment.ForProject(project.Id, safeFileName, command.ContentType, command.SizeBytes, storageKey);
        _db.Attachments.Add(attachment);
        await _audit.LogAsync(project.Id, null, AuditAction.Created, nameof(Attachment),
            $"Project file '{safeFileName}' uploaded.", cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return new AttachmentDto(attachment.Id, attachment.TaskId, attachment.ProjectId, attachment.FileName,
            attachment.ContentType, attachment.SizeBytes, attachment.CreatedAtUtc);
    }
}
