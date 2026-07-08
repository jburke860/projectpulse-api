using MediatR;
using Microsoft.AspNetCore.Mvc;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Application.Projects.Commands;
using ProjectPulse.Application.Projects.Dtos;
using ProjectPulse.Application.Projects.Queries;
using ProjectPulse.Application.Tasks.Dtos;

namespace ProjectPulse.Api.Controllers;

[ApiController]
[Route("api/projects")]
public class ProjectsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProjectsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<ApiResult<PagedResult<ProjectDto>>>> List(
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetProjectsQuery(page, pageSize), cancellationToken);
        return Ok(ApiResult<PagedResult<ProjectDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResult<ProjectDto>>> Create([FromBody] CreateProjectRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateProjectCommand(request), cancellationToken);
        return Ok(ApiResult<ProjectDto>.Ok(result, "Project created."));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResult<ProjectDto>>> Update(Guid id, [FromBody] UpdateProjectRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new UpdateProjectCommand(id, request), cancellationToken);
        return Ok(ApiResult<ProjectDto>.Ok(result, "Project updated."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResult<object>>> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _mediator.Send(new DeleteProjectCommand(id), cancellationToken);
        return Ok(ApiResult<object>.Ok(new { }, "Project deleted."));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResult<ProjectDto>>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetProjectByIdQuery(id), cancellationToken);
        return Ok(ApiResult<ProjectDto>.Ok(result));
    }

    [HttpPost("{id:guid}/members")]
    public async Task<ActionResult<ApiResult<object>>> AddMember(Guid id, [FromBody] AddProjectMemberRequest request, CancellationToken cancellationToken)
    {
        await _mediator.Send(new AddProjectMemberCommand(id, request), cancellationToken);
        return Ok(ApiResult<object>.Ok(new { }, "Member added."));
    }

    [HttpDelete("{id:guid}/members/{userId:guid}")]
    public async Task<ActionResult<ApiResult<object>>> RemoveMember(Guid id, Guid userId, CancellationToken cancellationToken)
    {
        await _mediator.Send(new RemoveProjectMemberCommand(id, userId), cancellationToken);
        return Ok(ApiResult<object>.Ok(new { }, "Member removed."));
    }

    [HttpGet("{id:guid}/members")]
    public async Task<IActionResult> GetMembers(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetProjectMembersQuery(id), cancellationToken);
        return Ok(ApiResult<object>.Ok(result));
    }

    [HttpGet("{id:guid}/labels")]
    public async Task<IActionResult> GetLabels(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetProjectLabelsQuery(id), cancellationToken);
        return Ok(ApiResult<object>.Ok(result));
    }

    [HttpGet("{id:guid}/attachments")]
    public async Task<ActionResult<ApiResult<IReadOnlyList<AttachmentDto>>>> GetAttachments(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetProjectAttachmentsQuery(id), cancellationToken);
        return Ok(ApiResult<IReadOnlyList<AttachmentDto>>.Ok(result));
    }

    [HttpPost("{id:guid}/attachments")]
    [RequestSizeLimit(5_242_880)]
    [RequestFormLimits(MultipartBodyLengthLimit = 5_242_880)]
    public async Task<ActionResult<ApiResult<AttachmentDto>>> UploadAttachment(Guid id, IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null)
        {
            return BadRequest(ApiResult<AttachmentDto>.Fail(["Attach a file using the 'file' form field."], "Validation failed"));
        }

        await using var stream = file.OpenReadStream();
        var result = await _mediator.Send(new UploadProjectAttachmentCommand(id, file.FileName, file.ContentType, file.Length, stream), cancellationToken);
        return Ok(ApiResult<AttachmentDto>.Ok(result, "Attachment uploaded."));
    }

    [HttpGet("{id:guid}/attachments/{attachmentId:guid}/download")]
    public async Task<IActionResult> DownloadAttachment(Guid id, Guid attachmentId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DownloadProjectAttachmentQuery(id, attachmentId), cancellationToken);
        return File(result.Content, result.ContentType, result.FileName);
    }

    [HttpDelete("{id:guid}/attachments/{attachmentId:guid}")]
    public async Task<ActionResult<ApiResult<object>>> DeleteAttachment(Guid id, Guid attachmentId, CancellationToken cancellationToken)
    {
        await _mediator.Send(new DeleteProjectAttachmentCommand(id, attachmentId), cancellationToken);
        return Ok(ApiResult<object>.Ok(new { }, "Attachment deleted."));
    }

    [HttpGet("{id:guid}/activity")]
    public async Task<IActionResult> GetActivity(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new Application.Audit.Queries.GetProjectActivityQuery(id), cancellationToken);
        return Ok(ApiResult<object>.Ok(result));
    }

    [HttpGet("{id:guid}/summary")]
    public async Task<IActionResult> GetSummary(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetProjectSummaryQuery(id), cancellationToken);
        return Ok(ApiResult<ProjectSummaryDto>.Ok(result));
    }
}
