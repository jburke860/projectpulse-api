using MediatR;
using Microsoft.AspNetCore.Mvc;
using ProjectPulse.Application.Common.Models;
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
}
