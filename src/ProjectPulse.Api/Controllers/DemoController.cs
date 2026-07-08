using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Application.Demo.Dtos;

namespace ProjectPulse.Api.Controllers;

[ApiController]
[Route("api/demo")]
public class DemoController : ControllerBase
{
    private readonly IDemoSessionService _demoSessions;

    public DemoController(IDemoSessionService demoSessions)
    {
        _demoSessions = demoSessions;
    }

    [HttpPost("sessions")]
    [EnableRateLimiting("demo-session-create")]
    public async Task<ActionResult<ApiResult<DemoSessionDto>>> CreateSession(CancellationToken cancellationToken)
    {
        var session = await _demoSessions.CreateAsync(cancellationToken);
        return Ok(ApiResult<DemoSessionDto>.Ok(session, "Demo session created."));
    }
}
