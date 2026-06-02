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

    [HttpGet]
    public async Task<ActionResult<ApiResult<IReadOnlyList<TaskDto>>>> List(
        [FromQuery] Guid? projectId,
        [FromQuery] string? status,
        [FromQuery] string? priority,
        [FromQuery] Guid? assigneeId,
        [FromQuery] DateTime? dueBeforeUtc,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetTasksQuery(projectId, status, priority, assigneeId, dueBeforeUtc), cancellationToken);
        return Ok(ApiResult<IReadOnlyList<TaskDto>>.Ok(result));
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

    [HttpPost("{id:guid}/comments")]
    public async Task<ActionResult<ApiResult<CommentDto>>> AddComment(Guid id, [FromBody] AddCommentRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new AddCommentCommand(id, request), cancellationToken);
        return Ok(ApiResult<CommentDto>.Ok(result, "Comment added."));
    }
}
