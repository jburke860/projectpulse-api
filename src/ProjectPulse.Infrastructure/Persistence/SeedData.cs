using Microsoft.EntityFrameworkCore;
using ProjectPulse.Domain.Entities;
using ProjectPulse.Domain.Enums;
using TaskItem = ProjectPulse.Domain.Entities.TaskItem;
using TaskPriority = ProjectPulse.Domain.Enums.TaskPriority;
using TaskStatus = ProjectPulse.Domain.Enums.TaskStatus;

namespace ProjectPulse.Infrastructure.Persistence;

public static class SeedData
{
    public static readonly Guid DemoAdminUserId = Guid.Parse("11111111-1111-1111-1111-111111111101");

    public static async Task InitializeAsync(ApplicationDbContext db, CancellationToken cancellationToken = default)
    {
        await db.Database.MigrateAsync(cancellationToken);
        if (await db.Projects.AnyAsync(cancellationToken))
        {
            return;
        }

        var users = new[]
        {
            new User(DemoAdminUserId, "jeremy.burke024@gmail.com", "Jeremy Burke"),
            new User("alex.morgan@example.com", "Alex Morgan"),
            new User("sam.lee@example.com", "Sam Lee"),
            new User("jordan.kim@example.com", "Jordan Kim"),
            new User("taylor.nguyen@example.com", "Taylor Nguyen"),
            new User("casey.wright@example.com", "Casey Wright"),
            new User("riley.chen@example.com", "Riley Chen"),
            new User("morgan.patel@example.com", "Morgan Patel")
        };

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
            db.ProjectMembers.Add(new ProjectMember(project.Id, DemoAdminUserId, ProjectRole.Admin));
            db.ProjectMembers.Add(new ProjectMember(project.Id, users[(index + 1) % users.Length].Id, ProjectRole.Member));
            db.ProjectMembers.Add(new ProjectMember(project.Id, users[(index + 2) % users.Length].Id, ProjectRole.Viewer));
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
                task.Assign(users[i % users.Length].Id);
            }

            tasks.Add(task);
        }

        db.Tasks.AddRange(tasks);
        await db.SaveChangesAsync(cancellationToken);

        foreach (var (task, index) in tasks.Select((t, i) => (t, i)))
        {
            db.Comments.Add(new Comment(task.Id, users[index % users.Length].Id, "Seeded comment for demo activity feed."));
            db.TaskLabels.Add(new TaskLabel(task.Id, labels[index % labels.Count].Id));
            db.Attachments.Add(new Attachment(task.Id, $"spec-{index + 1}.pdf", "application/pdf", 1024 * (index + 1), $"demo/tasks/{task.Id}/spec-{index + 1}.pdf"));
            db.AuditLogs.Add(new AuditLog(task.ProjectId, task.Id, DemoAdminUserId, AuditAction.Created, nameof(TaskItem), $"Seeded task '{task.Title}'."));
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
