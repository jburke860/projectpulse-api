using MediatR;
using Microsoft.AspNetCore.Mvc;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Application.Tasks.Commands;
using ProjectPulse.Application.Tasks.Dtos;
using ProjectPulse.Application.Tasks.Queries;

namespace ProjectPulse.Api.Controllers;

[ApiController]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly IMediator _mediator;

    public TasksController(IMediator mediator) => _mediator = mediator;

    [HttpPost]
    public async Task<ActionResult<ApiResult<TaskDto>>> Create([FromBody] CreateTaskRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateTaskCommand(request), cancellationToken);
        return Ok(ApiResult<TaskDto>.Ok(result, "Task created."));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResult<TaskDto>>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetTaskByIdQuery(id), cancellationToken);
        return Ok(ApiResult<TaskDto>.Ok(result));
    }

    [HttpGet("{id:guid}/comments")]
    public async Task<ActionResult<ApiResult<IReadOnlyList<CommentDto>>>> GetComments(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetTaskCommentsQuery(id), cancellationToken);
        return Ok(ApiResult<IReadOnlyList<CommentDto>>.Ok(result));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResult<TaskDto>>> Update(Guid id, [FromBody] UpdateTaskRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new UpdateTaskCommand(id, request), cancellationToken);
        return Ok(ApiResult<TaskDto>.Ok(result, "Task updated."));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResult<PagedResult<TaskDto>>>> List(
        [FromQuery] Guid? projectId,
        [FromQuery] string? status,
        [FromQuery] string? priority,
        [FromQuery] Guid? assigneeId,
        [FromQuery] DateTime? dueBeforeUtc,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetTasksQuery(projectId, status, priority, assigneeId, dueBeforeUtc, page, pageSize), cancellationToken);
        return Ok(ApiResult<PagedResult<TaskDto>>.Ok(result));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ApiResult<TaskDto>>> ChangeStatus(Guid id, [FromBody] ChangeTaskStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new ChangeTaskStatusCommand(id, request), cancellationToken);
        return Ok(ApiResult<TaskDto>.Ok(result, "Task status updated."));
    }

    [HttpPatch("{id:guid}/assign")]
    public async Task<ActionResult<ApiResult<TaskDto>>> Assign(Guid id, [FromBody] AssignTaskRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new AssignTaskCommand(id, request), cancellationToken);
        return Ok(ApiResult<TaskDto>.Ok(result, "Task assignment updated."));
    }

    [HttpPost("{id:guid}/labels")]
    public async Task<ActionResult<ApiResult<TaskDto>>> AttachLabel(Guid id, [FromBody] AttachLabelRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new AttachLabelCommand(id, request), cancellationToken);
        return Ok(ApiResult<TaskDto>.Ok(result, "Label attached."));
    }

    [HttpDelete("{id:guid}/labels/{labelId:guid}")]
    public async Task<ActionResult<ApiResult<TaskDto>>> DetachLabel(Guid id, Guid labelId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DetachLabelCommand(id, labelId), cancellationToken);
        return Ok(ApiResult<TaskDto>.Ok(result, "Label detached."));
    }

    [HttpGet("{id:guid}/attachments")]
    public async Task<ActionResult<ApiResult<IReadOnlyList<AttachmentDto>>>> GetAttachments(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetTaskAttachmentsQuery(id), cancellationToken);
        return Ok(ApiResult<IReadOnlyList<AttachmentDto>>.Ok(result));
    }

    [HttpPost("{id:guid}/attachments")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<ApiResult<AttachmentDto>>> UploadAttachment(Guid id, IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null)
        {
            return BadRequest(ApiResult<AttachmentDto>.Fail(["Attach a file using the 'file' form field."], "Validation failed"));
        }

        await using var content = file.OpenReadStream();
        var command = new UploadAttachmentCommand(id, file.FileName, file.ContentType, file.Length, content);
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(ApiResult<AttachmentDto>.Ok(result, "Attachment uploaded."));
    }

    [HttpGet("{id:guid}/attachments/{attachmentId:guid}/download")]
    public async Task<IActionResult> DownloadAttachment(Guid id, Guid attachmentId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DownloadAttachmentQuery(id, attachmentId), cancellationToken);
        return File(result.Content, result.ContentType, result.FileName);
    }

    [HttpDelete("{id:guid}/attachments/{attachmentId:guid}")]
    public async Task<ActionResult<ApiResult<object>>> DeleteAttachment(Guid id, Guid attachmentId, CancellationToken cancellationToken)
    {
        await _mediator.Send(new DeleteAttachmentCommand(id, attachmentId), cancellationToken);
        return Ok(ApiResult<object>.Ok(new { }, "Attachment deleted."));
    }

    [HttpPost("{id:guid}/comments")]
    public async Task<ActionResult<ApiResult<CommentDto>>> AddComment(Guid id, [FromBody] AddCommentRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new AddCommentCommand(id, request), cancellationToken);
        return Ok(ApiResult<CommentDto>.Ok(result, "Comment added."));
    }
}
