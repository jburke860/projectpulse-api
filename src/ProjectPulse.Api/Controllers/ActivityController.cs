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
    public async Task<ActionResult<ApiResult<IReadOnlyList<AuditLogDto>>>> List([FromQuery] int limit = 50, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetActivityQuery(limit), cancellationToken);
        return Ok(ApiResult<IReadOnlyList<AuditLogDto>>.Ok(result));
    }
}
