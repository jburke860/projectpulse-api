using MediatR;
using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Attachments.Dtos;
using ProjectPulse.Application.Common.Extensions;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Application.Common.Models;

namespace ProjectPulse.Application.Attachments.Queries;

public record GetWorkspaceAttachmentsQuery(int? Page = null, int? PageSize = null)
    : IRequest<PagedResult<WorkspaceAttachmentDto>>;

public class GetWorkspaceAttachmentsQueryHandler
    : IRequestHandler<GetWorkspaceAttachmentsQuery, PagedResult<WorkspaceAttachmentDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetWorkspaceAttachmentsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<WorkspaceAttachmentDto>> Handle(
        GetWorkspaceAttachmentsQuery query,
        CancellationToken cancellationToken)
    {
        var attachments = _db.Attachments.AsNoTracking()
            .VisibleTo(_currentUser.UserId);

        var (page, pageSize) = Paging.Clamp(query.Page, query.PageSize);
        var totalCount = await attachments.CountAsync(cancellationToken);

        var items = await attachments
            .OrderByDescending(a => a.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new WorkspaceAttachmentDto(
                a.Id,
                a.FileName,
                a.ContentType,
                a.SizeBytes,
                a.CreatedAtUtc,
                a.ProjectId ?? a.Task!.ProjectId,
                a.ProjectId != null ? a.Project!.Name : a.Task!.Project.Name,
                a.TaskId,
                a.TaskId != null ? a.Task!.Title : null))
            .ToListAsync(cancellationToken);

        return new PagedResult<WorkspaceAttachmentDto>(items, totalCount, page, pageSize);
    }
}
