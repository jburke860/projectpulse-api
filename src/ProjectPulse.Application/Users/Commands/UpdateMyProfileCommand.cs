using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Constants;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Users.Dtos;

namespace ProjectPulse.Application.Users.Commands;

public record UpdateMyProfileCommand(UpdateProfileRequest Request) : IRequest<UserDto>;

public class UpdateMyProfileCommandValidator : AbstractValidator<UpdateMyProfileCommand>
{
    public UpdateMyProfileCommandValidator()
    {
        RuleFor(x => x.Request.DisplayName).NotEmpty().MaximumLength(100);
    }
}

public class UpdateMyProfileCommandHandler : IRequestHandler<UpdateMyProfileCommand, UserDto>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public UpdateMyProfileCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<UserDto> Handle(UpdateMyProfileCommand command, CancellationToken cancellationToken)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == _currentUser.UserId, cancellationToken)
            ?? throw new Common.Exceptions.ValidationException(new Dictionary<string, string[]>
            {
                ["demoSession"] = ["Start a demo session before editing the profile."]
            });

        user.Rename(command.Request.DisplayName.Trim());
        await _db.SaveChangesAsync(cancellationToken);

        var projectCount = await _db.ProjectMembers.CountAsync(m => m.UserId == user.Id, cancellationToken);
        var taskCount = await _db.Tasks.CountAsync(
            t => t.AssigneeId == user.Id &&
                 t.Status != Domain.Enums.TaskStatus.Done &&
                 t.Status != Domain.Enums.TaskStatus.Cancelled,
            cancellationToken);

        return new UserDto(
            user.Id,
            user.DisplayName,
            DemoSessionConstants.PublicDemoEmail(user.Email),
            projectCount,
            taskCount);
    }
}
