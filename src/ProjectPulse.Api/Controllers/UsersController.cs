using MediatR;
using Microsoft.AspNetCore.Mvc;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Application.Users.Commands;
using ProjectPulse.Application.Users.Dtos;
using ProjectPulse.Application.Users.Queries;

namespace ProjectPulse.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<ApiResult<PagedResult<UserDto>>>> List(
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetUsersQuery(page, pageSize), cancellationToken);
        return Ok(ApiResult<PagedResult<UserDto>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResult<UserProfileDto>>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetUserProfileQuery(id), cancellationToken);
        return Ok(ApiResult<UserProfileDto>.Ok(result));
    }

    [HttpPut("me")]
    public async Task<ActionResult<ApiResult<UserDto>>> UpdateMe(
        [FromBody] UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new UpdateMyProfileCommand(request), cancellationToken);
        return Ok(ApiResult<UserDto>.Ok(result));
    }
}
