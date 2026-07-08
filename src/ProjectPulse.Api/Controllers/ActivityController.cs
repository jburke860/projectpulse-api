using MediatR;
using Microsoft.AspNetCore.Mvc;
using ProjectPulse.Application.Audit.Dtos;
using ProjectPulse.Application.Audit.Queries;
using ProjectPulse.Application.Common.Models;

namespace ProjectPulse.Api.Controllers;

[ApiController]
[Route("api/activity")]
public class ActivityController : ControllerBase
{
    private readonly IMediator _mediator;

    public ActivityController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<ApiResult<PagedResult<AuditLogDto>>>> List(
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        [FromQuery] int? limit,
        CancellationToken cancellationToken = default)
    {
        // `limit` predates pagination and is kept as an alias for pageSize.
        var result = await _mediator.Send(new GetActivityQuery(page, pageSize ?? limit), cancellationToken);
        return Ok(ApiResult<PagedResult<AuditLogDto>>.Ok(result));
    }
}
