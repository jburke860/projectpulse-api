using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Projects.Dtos;
using ProjectPulse.Domain.Entities;
using ProjectPulse.Domain.Enums;
using ProjectPulse.Domain.Rules;

namespace ProjectPulse.Application.Projects.Commands;

public record AddProjectMemberCommand(Guid ProjectId, AddProjectMemberRequest Request) : IRequest<Unit>;

public class AddProjectMemberCommandValidator : AbstractValidator<AddProjectMemberCommand>
{
    public AddProjectMemberCommandValidator()
    {
        RuleFor(x => x.Request.UserId).NotEmpty();
        RuleFor(x => x.Request.Role).NotEmpty().Must(BeValidRole);
    }

    private static bool BeValidRole(string role) =>
        Enum.TryParse<ProjectRole>(role, true, out _);
}

public class AddProjectMemberCommandHandler : IRequestHandler<AddProjectMemberCommand, Unit>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;

    public AddProjectMemberCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IAuditService audit)
    {
        _db = db;
        _currentUser = currentUser;
        _audit = audit;
    }

    public async Task<Unit> Handle(AddProjectMemberCommand command, CancellationToken cancellationToken)
    {
        var actorRole = await _db.ProjectMembers
            .Where(m => m.ProjectId == command.ProjectId && m.UserId == _currentUser.UserId)
            .Select(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);

        ProjectMembershipRules.EnsureCanManageTasks(actorRole);
        if (!ProjectMembershipRules.CanManageMembers(actorRole))
        {
            throw new Common.Exceptions.ValidationException(new Dictionary<string, string[]>
            {
                ["role"] = ["Only project admins can add members."]
            });
        }

        var displayName = await _db.Users
            .Where(u => u.Id == command.Request.UserId)
            .Select(u => u.DisplayName)
            .FirstOrDefaultAsync(cancellationToken);
        if (displayName is null)
        {
            throw new NotFoundException($"User {command.Request.UserId} was not found.");
        }

        var alreadyMember = await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == command.ProjectId && m.UserId == command.Request.UserId, cancellationToken);
        if (alreadyMember)
        {
            throw new Common.Exceptions.ValidationException(new Dictionary<string, string[]>
            {
                ["userId"] = ["User is already a project member."]
            });
        }

        var role = Enum.Parse<ProjectRole>(command.Request.Role, true);
        _db.ProjectMembers.Add(new ProjectMember(command.ProjectId, command.Request.UserId, role));
        await _audit.LogAsync(command.ProjectId, null, AuditAction.MemberAdded, nameof(ProjectMember),
            $"{displayName} added as {role}.", cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}
