using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Users.Dtos;

namespace ProjectPulse.Application.Users.Queries;

public record GetUsersQuery : IRequest<IReadOnlyList<UserDto>>;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, IReadOnlyList<UserDto>>
{
    private readonly IApplicationDbContext _db;

    public GetUsersQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<UserDto>> Handle(GetUsersQuery query, CancellationToken cancellationToken) =>
        await _db.Users.AsNoTracking()
            .OrderBy(u => u.DisplayName)
            .Select(u => new UserDto(u.Id, u.DisplayName, u.Email))
            .ToListAsync(cancellationToken);
}
