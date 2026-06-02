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

public record AddCommentCommand(Guid TaskId, AddCommentRequest Request) : IRequest<CommentDto>;

public record CommentDto(Guid Id, Guid TaskId, Guid AuthorId, string AuthorName, string Body, DateTime CreatedAtUtc);

public class AddCommentCommandValidator : AbstractValidator<AddCommentCommand>
{
    public AddCommentCommandValidator() => RuleFor(x => x.Request.Body).NotEmpty().MaximumLength(4000);
}

public class AddCommentCommandHandler : IRequestHandler<AddCommentCommand, CommentDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;

    public AddCommentCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IAuditService audit)
    {
        _db = db;
        _currentUser = currentUser;
        _audit = audit;
    }

    public async Task<CommentDto> Handle(AddCommentCommand command, CancellationToken cancellationToken)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == command.TaskId, cancellationToken)
            ?? throw new NotFoundException($"Task {command.TaskId} was not found.");

        var role = await _db.ProjectMembers
            .Where(m => m.ProjectId == task.ProjectId && m.UserId == _currentUser.UserId)
            .Select(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);
        ProjectMembershipRules.EnsureCanManageTasks(role);

        var comment = new Comment(command.TaskId, _currentUser.UserId, command.Request.Body);
        _db.Comments.Add(comment);
        await _audit.LogAsync(task.ProjectId, task.Id, AuditAction.CommentAdded, nameof(Comment), "Comment added.", cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        var author = await _db.Users.Where(u => u.Id == _currentUser.UserId).Select(u => u.DisplayName).FirstAsync(cancellationToken);
        return new CommentDto(comment.Id, comment.TaskId, comment.AuthorId, author, comment.Body, comment.CreatedAtUtc);
    }
}
