using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Extensions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Projects.Dtos;
using ProjectPulse.Domain.Entities;
using ProjectPulse.Domain.Enums;
using ProjectPulse.Domain.Rules;

namespace ProjectPulse.Application.Projects.Commands;

public record UpdateProjectCommand(Guid ProjectId, UpdateProjectRequest Request) : IRequest<ProjectDto>;

public class UpdateProjectCommandValidator : AbstractValidator<UpdateProjectCommand>
{
    public UpdateProjectCommandValidator()
    {
        RuleFor(x => x.Request.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Request.Description).MaximumLength(2000);
        RuleFor(x => x.Request.Status)
            .NotEmpty()
            .Must(s => Enum.TryParse<ProjectStatus>(s, true, out _))
            .WithMessage("Status must be one of: Planning, Active, OnHold, Completed.");
    }
}

public class UpdateProjectCommandHandler : IRequestHandler<UpdateProjectCommand, ProjectDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;

    public UpdateProjectCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IAuditService audit)
    {
        _db = db;
        _currentUser = currentUser;
        _audit = audit;
    }

    public async Task<ProjectDto> Handle(UpdateProjectCommand command, CancellationToken cancellationToken)
    {
        var project = await _db.Projects
            .Where(p => p.Id == command.ProjectId)
            .VisibleTo(_currentUser.UserId)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new Common.Exceptions.NotFoundException($"Project {command.ProjectId} was not found.");

        var actorRole = await _db.ProjectMembers
            .Where(m => m.ProjectId == command.ProjectId && m.UserId == _currentUser.UserId)
            .Select(m => m.Role)
            .FirstOrDefaultAsync(cancellationToken);

        if (!ProjectMembershipRules.CanManageMembers(actorRole))
        {
            throw new Common.Exceptions.ValidationException(new Dictionary<string, string[]>
            {
                ["authorization"] = ["Only project admins can update project details."]
            });
        }

        var status = Enum.Parse<ProjectStatus>(command.Request.Status, true);
        project.Update(command.Request.Name, command.Request.Description, status);
        await _audit.LogAsync(project.Id, null, AuditAction.Updated, nameof(Project), $"Project '{project.Name}' updated.", cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        var memberCount = await _db.ProjectMembers.CountAsync(m => m.ProjectId == project.Id, cancellationToken);
        var taskCount = await _db.Tasks.CountAsync(t => t.ProjectId == project.Id, cancellationToken);

        return new ProjectDto(project.Id, project.Name, project.Description, project.Status.ToString(), project.CreatedAtUtc, memberCount, taskCount, project.Icon, project.Color);
    }
}
