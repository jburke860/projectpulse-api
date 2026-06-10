using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Extensions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Users.Dtos;

namespace ProjectPulse.Application.Users.Queries;

public record GetUsersQuery : IRequest<IReadOnlyList<UserDto>>;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, IReadOnlyList<UserDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetUsersQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<UserDto>> Handle(GetUsersQuery query, CancellationToken cancellationToken) =>
        await _db.Users.AsNoTracking()
            .VisibleTo(_currentUser.UserId)
            .OrderBy(u => u.DisplayName)
            .Select(u => new UserDto(u.Id, u.DisplayName, u.Email))
            .ToListAsync(cancellationToken);
}
