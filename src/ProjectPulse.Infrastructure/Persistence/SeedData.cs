using Microsoft.EntityFrameworkCore;
using ProjectPulse.Application.Common.Constants;
using ProjectPulse.Domain.Entities;
using ProjectPulse.Domain.Enums;
using TaskItem = ProjectPulse.Domain.Entities.TaskItem;
using TaskPriority = ProjectPulse.Domain.Enums.TaskPriority;
using TaskStatus = ProjectPulse.Domain.Enums.TaskStatus;

namespace ProjectPulse.Infrastructure.Persistence;

public static class SeedData
{
    public static readonly Guid DemoAdminUserId = Guid.Parse("11111111-1111-1111-1111-111111111101");

    private static readonly (string Email, string DisplayName)[] LocalUsers =
    [
        ("alex.morgan@example.com", "Alex Morgan"),
        ("sam.lee@example.com", "Sam Lee"),
        ("jordan.kim@example.com", "Jordan Kim"),
        ("taylor.nguyen@example.com", "Taylor Nguyen"),
        ("casey.wright@example.com", "Casey Wright"),
        ("riley.chen@example.com", "Riley Chen"),
        ("morgan.patel@example.com", "Morgan Patel")
    ];

    private static readonly (string Key, string DisplayName)[] DemoUsers =
    [
        ("alex", "Alex Morgan"),
        ("sam", "Sam Lee"),
        ("jordan", "Jordan Kim"),
        ("taylor", "Taylor Nguyen"),
        ("casey", "Casey Wright"),
        ("riley", "Riley Chen"),
        ("morgan", "Morgan Patel")
    ];

    public static async Task InitializeAsync(ApplicationDbContext db, CancellationToken cancellationToken = default)
    {
        await db.Database.MigrateAsync(cancellationToken);
        if (await db.Projects.AnyAsync(cancellationToken))
        {
            return;
        }

        var users = new List<User> { new(DemoAdminUserId, "jeremy.burke024@gmail.com", "Jeremy Burke") };
        users.AddRange(LocalUsers.Select(user => new User(user.Email, user.DisplayName)));

        await SeedWorkspaceAsync(db, users, DemoAdminUserId, cancellationToken);
    }

    public static async Task SeedDemoWorkspaceAsync(ApplicationDbContext db, Guid sessionUserId, CancellationToken cancellationToken = default)
    {
        var users = new List<User>
        {
            new(
                sessionUserId,
                DemoSessionConstants.SessionEmail(sessionUserId, DemoSessionConstants.AdminEmailLocalPart),
                "Demo User")
        };

        users.AddRange(DemoUsers.Select(user =>
            new User(DemoSessionConstants.SessionEmail(sessionUserId, user.Key), user.DisplayName)));

        await SeedWorkspaceAsync(db, users, sessionUserId, cancellationToken);
    }

    private static async Task SeedWorkspaceAsync(
        ApplicationDbContext db,
        IReadOnlyList<User> users,
        Guid adminUserId,
        CancellationToken cancellationToken)
    {
        db.Users.AddRange(users);

        var projects = new[]
        {
            new Project("ProjectPulse Platform", "Core API and delivery workflows"),
            new Project("Customer Onboarding", "Improve activation and first-week success"),
            new Project("Mobile Companion", "Lightweight task views for field teams")
        };

        db.Projects.AddRange(projects);
        await db.SaveChangesAsync(cancellationToken);

        foreach (var (project, index) in projects.Select((p, i) => (p, i)))
        {
            db.ProjectMembers.Add(new ProjectMember(project.Id, adminUserId, ProjectRole.Admin));
            db.ProjectMembers.Add(new ProjectMember(project.Id, users[(index + 1) % users.Count].Id, ProjectRole.Member));
            db.ProjectMembers.Add(new ProjectMember(project.Id, users[(index + 2) % users.Count].Id, ProjectRole.Viewer));
        }

        var labels = new List<Label>();
        foreach (var project in projects)
        {
            labels.AddRange(
            [
                new Label(project.Id, "bug", "#ef4444"),
                new Label(project.Id, "feature", "#22c55e"),
                new Label(project.Id, "blocked", "#f59e0b")
            ]);
        }

        db.Labels.AddRange(labels);
        await db.SaveChangesAsync(cancellationToken);

        var tasks = new List<TaskItem>();
        var statuses = new[] { TaskStatus.Open, TaskStatus.InProgress, TaskStatus.InReview, TaskStatus.Done };
        var priorities = new[] { TaskPriority.Low, TaskPriority.Medium, TaskPriority.High, TaskPriority.Critical };

        for (var i = 0; i < 25; i++)
        {
            var project = projects[i % projects.Length];
            var task = new TaskItem(
                project.Id,
                $"Task {i + 1}: {(i % 2 == 0 ? "Implement endpoint" : "Write integration test")}",
                "Seeded demo task for local API exploration.",
                priorities[i % priorities.Length],
                DateTime.UtcNow.Date.AddDays(i % 14));
            ApplyDemoStatus(task, statuses[i % statuses.Length]);
            if (i % 3 == 0)
            {
                task.Assign(users[i % users.Count].Id);
            }

            tasks.Add(task);
        }

        db.Tasks.AddRange(tasks);
        await db.SaveChangesAsync(cancellationToken);

        foreach (var (task, index) in tasks.Select((t, i) => (t, i)))
        {
            db.Comments.Add(new Comment(task.Id, users[index % users.Count].Id, "Seeded comment for demo activity feed."));
            db.TaskLabels.Add(new TaskLabel(task.Id, labels[index % labels.Count].Id));
            db.Attachments.Add(new Attachment(task.Id, $"spec-{index + 1}.pdf", "application/pdf", 1024 * (index + 1), $"demo/tasks/{task.Id}/spec-{index + 1}.pdf"));
            db.AuditLogs.Add(new AuditLog(task.ProjectId, task.Id, adminUserId, AuditAction.Created, nameof(TaskItem), $"Seeded task '{task.Title}'."));
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static void ApplyDemoStatus(TaskItem task, TaskStatus target)
    {
        if (target == TaskStatus.Open)
        {
            return;
        }

        if (target is TaskStatus.InProgress or TaskStatus.InReview or TaskStatus.Done or TaskStatus.Cancelled)
        {
            task.ChangeStatus(TaskStatus.InProgress);
        }

        if (target is TaskStatus.InReview or TaskStatus.Done)
        {
            task.ChangeStatus(TaskStatus.InReview);
        }

        if (target == TaskStatus.Done)
        {
            task.ChangeStatus(TaskStatus.Done);
        }

        if (target == TaskStatus.Cancelled)
        {
            task.ChangeStatus(TaskStatus.Cancelled);
        }
    }
}
