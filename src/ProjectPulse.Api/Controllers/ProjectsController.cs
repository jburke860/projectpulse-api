using MediatR;
using Microsoft.AspNetCore.Mvc;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Application.Projects.Commands;
using ProjectPulse.Application.Projects.Dtos;
using ProjectPulse.Application.Projects.Queries;

namespace ProjectPulse.Api.Controllers;

[ApiController]
[Route("api/projects")]
public class ProjectsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProjectsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<ApiResult<IReadOnlyList<ProjectDto>>>> List(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetProjectsQuery(), cancellationToken);
        return Ok(ApiResult<IReadOnlyList<ProjectDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResult<ProjectDto>>> Create([FromBody] CreateProjectRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateProjectCommand(request), cancellationToken);
        return Ok(ApiResult<ProjectDto>.Ok(result, "Project created."));
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
