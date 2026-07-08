using ProjectPulse.Application.Common.Constants;
using ProjectPulse.Domain.Entities;
using TaskItem = ProjectPulse.Domain.Entities.TaskItem;

namespace ProjectPulse.Application.Common.Extensions;

public static class WorkspaceQueryExtensions
{
    public static IQueryable<Project> VisibleTo(this IQueryable<Project> projects, Guid userId) =>
        projects.Where(p => p.Members.Any(m => m.UserId == userId));

    public static IQueryable<ProjectMember> VisibleTo(this IQueryable<ProjectMember> members, Guid userId) =>
        members.Where(m => m.Project.Members.Any(pm => pm.UserId == userId));

    public static IQueryable<TaskItem> VisibleTo(this IQueryable<TaskItem> tasks, Guid userId) =>
        tasks.Where(t => t.Project.Members.Any(m => m.UserId == userId));

    public static IQueryable<Comment> VisibleTo(this IQueryable<Comment> comments, Guid userId) =>
        comments.Where(c => c.Task.Project.Members.Any(m => m.UserId == userId));

    public static IQueryable<AuditLog> VisibleTo(this IQueryable<AuditLog> auditLogs, Guid userId) =>
        auditLogs.Where(a => a.Project.Members.Any(m => m.UserId == userId));

    public static IQueryable<Label> VisibleTo(this IQueryable<Label> labels, Guid userId) =>
        labels.Where(l => l.Project.Members.Any(m => m.UserId == userId));

    public static IQueryable<Attachment> VisibleTo(this IQueryable<Attachment> attachments, Guid userId) =>
        attachments.Where(a =>
            (a.TaskId != null && a.Task!.Project.Members.Any(m => m.UserId == userId)) ||
            (a.ProjectId != null && a.Project!.Members.Any(m => m.UserId == userId)));

    public static IQueryable<User> VisibleTo(this IQueryable<User> users, Guid userId)
    {
        var demoEmailSuffix = DemoSessionConstants.EmailSessionSuffix(userId);

        return users.Where(u =>
            u.Id == userId ||
            u.Email.EndsWith(demoEmailSuffix) ||
            u.Memberships.Any(m => m.Project.Members.Any(pm => pm.UserId == userId)));
    }
}
