using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Domain.Entities;
using ProjectPulse.Domain.Rules;

namespace ProjectPulse.Application.Projects.Commands;

public record DeleteProjectCommand(Guid ProjectId) : IRequest<Unit>;

public class DeleteProjectCommandHandler : IRequestHandler<DeleteProjectCommand, Unit>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public DeleteProjectCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Unit> Handle(DeleteProjectCommand command, CancellationToken cancellationToken)
    {
        var project = await _db.Projects
            .FirstOrDefaultAsync(p => p.Id == command.ProjectId, cancellationToken)
            ?? throw new NotFoundException($"Project {command.ProjectId} was not found.");

        var actorRole = await _db.ProjectMembers
            .Where(m => m.ProjectId == command.ProjectId && m.UserId == _currentUser.UserId)
            .Select(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);

        if (!ProjectMembershipRules.CanManageMembers(actorRole))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["authorization"] = ["Only project admins can delete projects."]
            });
        }

        _db.Projects.Remove(project);
        await _db.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
