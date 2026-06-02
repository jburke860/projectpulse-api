using Microsoft.EntityFrameworkCore;
using ProjectPulse.Domain.Entities;

namespace ProjectPulse.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Project> Projects { get; }
    DbSet<ProjectMember> ProjectMembers { get; }
    DbSet<TaskItem> Tasks { get; }
    DbSet<Comment> Comments { get; }
    DbSet<Label> Labels { get; }
    DbSet<TaskLabel> TaskLabels { get; }
    DbSet<Attachment> Attachments { get; }
    DbSet<AuditLog> AuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
