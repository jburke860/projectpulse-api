using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Projects.Dtos;
using ProjectPulse.Domain.Entities;
using ProjectPulse.Domain.Enums;

namespace ProjectPulse.Application.Projects.Commands;

public record CreateProjectCommand(CreateProjectRequest Request) : IRequest<ProjectDto>;

public class CreateProjectCommandValidator : AbstractValidator<CreateProjectCommand>
{
    public CreateProjectCommandValidator()
    {
        RuleFor(x => x.Request.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Request.Description).MaximumLength(2000);
        RuleFor(x => x.Request.Status)
            .Must(s => s == null || Enum.TryParse<ProjectStatus>(s, true, out _))
            .WithMessage("Status must be one of: Planning, Active, OnHold, Completed.");
    }
}

public class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand, ProjectDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;

    public CreateProjectCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IAuditService audit)
    {
        _db = db;
        _currentUser = currentUser;
        _audit = audit;
    }

    public async Task<ProjectDto> Handle(CreateProjectCommand command, CancellationToken cancellationToken)
    {
        var currentUserExists = await _db.Users.AnyAsync(u => u.Id == _currentUser.UserId, cancellationToken);
        if (!currentUserExists)
        {
            throw new Common.Exceptions.ValidationException(new Dictionary<string, string[]>
            {
                ["demoSession"] = ["Start a demo session before creating projects."]
            });
        }

        var status = command.Request.Status is null
            ? ProjectStatus.Active
            : Enum.Parse<ProjectStatus>(command.Request.Status, true);

        var project = new Project(command.Request.Name, command.Request.Description, status);
        _db.Projects.Add(project);
        _db.ProjectMembers.Add(new ProjectMember(project.Id, _currentUser.UserId, ProjectRole.Admin));
        await _audit.LogAsync(project.Id, null, AuditAction.Created, nameof(Project), $"Project '{project.Name}' created.", cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return new ProjectDto(project.Id, project.Name, project.Description, project.Status.ToString(), project.CreatedAtUtc, 1, 0);
    }
}
