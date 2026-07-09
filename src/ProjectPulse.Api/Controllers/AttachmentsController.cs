using MediatR;
using Microsoft.AspNetCore.Mvc;
using ProjectPulse.Application.Attachments.Dtos;
using ProjectPulse.Application.Attachments.Queries;
using ProjectPulse.Application.Common.Models;

namespace ProjectPulse.Api.Controllers;

[ApiController]
[Route("api/attachments")]
public class AttachmentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AttachmentsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<ApiResult<PagedResult<WorkspaceAttachmentDto>>>> List(
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetWorkspaceAttachmentsQuery(page, pageSize), cancellationToken);
        return Ok(ApiResult<PagedResult<WorkspaceAttachmentDto>>.Ok(result));
    }
}
