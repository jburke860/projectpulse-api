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

    private static readonly UserSeed[] TeamMembers =
    [
        new("jeremy.demo", "Jeremy Burke"),
        new("sarah.kim", "Sarah Kim"),
        new("marcus.lee", "Marcus Lee"),
        new("priya.patel", "Priya Patel"),
        new("daniel.roberts", "Daniel Roberts"),
        new("emily.carter", "Emily Carter"),
        new("jordan.nguyen", "Jordan Nguyen"),
        new("nina.garcia", "Nina Garcia"),
        new("omar.hassan", "Omar Hassan"),
        new("lauren.brooks", "Lauren Brooks"),
        new("ben.wilson", "Ben Wilson"),
        new("amara.okafor", "Amara Okafor"),
        new("chloe.martin", "Chloe Martin"),
        new("ethan.wright", "Ethan Wright"),
        new("maya.singh", "Maya Singh")
    ];

    private static readonly LabelSeed[] Labels =
    [
        new("product", "#38bdf8"),
        new("frontend", "#f97316"),
        new("backend", "#8b5cf6"),
        new("qa", "#22c55e"),
        new("ops", "#f59e0b"),
        new("research", "#14b8a6"),
        new("security", "#ef4444"),
        new("docs", "#64748b")
    ];

    private static readonly ProjectSeed[] Projects =
    [
        new(
            "Customer Portal Redesign",
            "Modernize the customer-facing dashboard, improve onboarding, and add account activity visibility.",
            ["jeremy.demo", "sarah.kim", "marcus.lee", "priya.patel", "daniel.roberts", "emily.carter"],
            [
                new(
                    "Finalize onboarding checklist copy",
                    "Rewrite the first-run checklist so account owners understand which profile, billing, and team setup steps unlock the dashboard.",
                    TaskPriority.Medium,
                    TaskStatus.InReview,
                    3,
                    "sarah.kim",
                    "jeremy.demo",
                    "The checklist reads clearly now. I left one comment on the billing step because trial accounts should see different language.",
                    ["product", "docs"],
                    "onboarding-checklist-copy.md"),
                new(
                    "Build account activity timeline",
                    "Add a timeline that groups profile changes, billing events, and invitation activity by day for customer admins.",
                    TaskPriority.High,
                    TaskStatus.InProgress,
                    6,
                    "marcus.lee",
                    "priya.patel",
                    "The activity grouping matches support's call notes. Please keep the billing events collapsed by default.",
                    ["frontend", "backend"],
                    "activity-timeline-wireframe.png"),
                new(
                    "Review mobile dashboard layout",
                    "Validate the redesigned dashboard at 375px, 768px, and tablet breakpoints before the design review.",
                    TaskPriority.Medium,
                    TaskStatus.Open,
                    5,
                    "emily.carter",
                    "sarah.kim",
                    "The account summary card feels too tall on small screens; otherwise the hierarchy is much better.",
                    ["frontend", "qa"]),
                new(
                    "Connect profile settings form to API",
                    "Wire the settings form to the profile endpoint and show field-level errors from backend validation.",
                    TaskPriority.High,
                    TaskStatus.Done,
                    2,
                    "jeremy.demo",
                    "marcus.lee",
                    "Merged the API client changes and confirmed validation messages are mapping to the right fields.",
                    ["frontend", "backend"],
                    "profile-settings-api-contract.json"),
                new(
                    "QA password-reset flow",
                    "Run the password-reset flow across expired links, reused tokens, and successful reset paths.",
                    TaskPriority.Critical,
                    TaskStatus.InProgress,
                    1,
                    "daniel.roberts",
                    "daniel.roberts",
                    "Expired links are handled correctly. I found one missing success event after the final redirect.",
                    ["qa", "security"])
            ],
            Files: ["project-brief.pdf", "onboarding-requirements.xlsx", "design-review-notes.md"]),
        new(
            "Internal Ops Automation",
            "Automate recurring operations workflows, reduce manual status tracking, and improve team handoff visibility.",
            ["jeremy.demo", "priya.patel", "daniel.roberts", "nina.garcia", "omar.hassan", "lauren.brooks"],
            [
                new(
                    "Map current approval workflow",
                    "Document the handoffs between customer success, finance, and operations before automation rules are finalized.",
                    TaskPriority.Medium,
                    TaskStatus.Done,
                    4,
                    "nina.garcia",
                    "omar.hassan",
                    "The map captures the exception path for enterprise approvals. Finance asked for one extra review checkpoint.",
                    ["research", "ops"],
                    "approval-workflow-map.pdf"),
                new(
                    "Add automation status badges",
                    "Display Waiting on approver, Ready to process, and Needs exception badges in the ops queue.",
                    TaskPriority.High,
                    TaskStatus.InProgress,
                    6,
                    "jeremy.demo",
                    "lauren.brooks",
                    "Badge labels match the language ops uses in standup. Please keep the amber state for blocked approvals.",
                    ["frontend", "ops"]),
                new(
                    "Draft exception-handling rules",
                    "Define when automation should pause, notify an owner, or retry without human review.",
                    TaskPriority.High,
                    TaskStatus.InReview,
                    8,
                    "omar.hassan",
                    "nina.garcia",
                    "Added the edge cases from last week's renewal escalations. Legal review is the only open item.",
                    ["ops", "docs"],
                    "exception-rules-draft.md"),
                new(
                    "Review audit log export format",
                    "Confirm CSV columns and timestamp format before ops exports become self-serve.",
                    TaskPriority.Medium,
                    TaskStatus.Open,
                    7,
                    "lauren.brooks",
                    "daniel.roberts",
                    "Please include actor email in the export. Ops uses it to match requests back to support tickets.",
                    ["ops", "qa"]),
                new(
                    "Validate notification triggers",
                    "Test reminder notifications for pending approvals, stale exceptions, and completed automations.",
                    TaskPriority.Critical,
                    TaskStatus.InProgress,
                    2,
                    "daniel.roberts",
                    "jeremy.demo",
                    "The stale exception trigger is firing correctly. Pending approval reminders still need the new delay window.",
                    ["backend", "qa"])
            ],
            Files: ["automation-scope.pdf", "workflow-inventory.xlsx", "stakeholder-signoff.md"]),
        new(
            "API Reliability Sprint",
            "Improve backend stability, task workflow validation, and observability for project-management operations.",
            ["jeremy.demo", "marcus.lee", "priya.patel", "daniel.roberts", "ben.wilson", "ethan.wright"],
            [
                new(
                    "Add validation for invalid task transitions",
                    "Prevent cancelled tasks from moving back into active workflow states without an explicit reopen action.",
                    TaskPriority.Critical,
                    TaskStatus.InProgress,
                    2,
                    "marcus.lee",
                    "daniel.roberts",
                    "The transition matrix covers the bug QA found. Please add one case for Done to Cancelled before merge.",
                    ["backend", "qa"],
                    "task-transition-matrix.xlsx"),
                new(
                    "Review slow dashboard query path",
                    "Profile dashboard aggregation queries and remove avoidable includes from the high-traffic summary endpoint.",
                    TaskPriority.High,
                    TaskStatus.InReview,
                    5,
                    "ben.wilson",
                    "marcus.lee",
                    "The new projection drops the query time under the target on the staging dataset.",
                    ["backend", "ops"]),
                new(
                    "Document retry behavior for failed requests",
                    "Write API guidance for retryable errors, non-retryable validation failures, and idempotent create requests.",
                    TaskPriority.Medium,
                    TaskStatus.Open,
                    9,
                    "jeremy.demo",
                    "priya.patel",
                    "Please call out 409 conflicts separately; integrations need to handle those without retry storms.",
                    ["docs", "backend"]),
                new(
                    "Add health-check endpoint",
                    "Expose a lightweight health endpoint that reports database connectivity for platform monitoring.",
                    TaskPriority.High,
                    TaskStatus.Done,
                    1,
                    "priya.patel",
                    "ben.wilson",
                    "Health checks are green in staging and the response shape matches the monitoring parser.",
                    ["backend", "ops"]),
                new(
                    "Expand integration coverage for member removal",
                    "Add tests that verify member removal unassigns tasks, writes audit history, and keeps project data intact.",
                    TaskPriority.Medium,
                    TaskStatus.InProgress,
                    4,
                    "daniel.roberts",
                    "jeremy.demo",
                    "This is the right coverage for the customer bug. Please include the project-admin case too.",
                    ["qa", "backend"])
            ],
            Files: ["reliability-plan.pdf", "sla-targets.xlsx", "incident-runbook.md"]),
        new(
            "Billing Insights Launch",
            "Give finance and account teams clearer subscription, invoice, and usage signals before renewal conversations.",
            ["jeremy.demo", "sarah.kim", "ben.wilson", "chloe.martin", "maya.singh", "omar.hassan"],
            [
                new(
                    "Reconcile subscription event mapping",
                    "Compare billing provider events against the account timeline so renewals, plan changes, and failed payments line up.",
                    TaskPriority.High,
                    TaskStatus.InProgress,
                    5,
                    "ben.wilson",
                    "maya.singh",
                    "The renewal and plan-change events line up. Failed payment retries still need clearer labels.",
                    ["backend", "ops"],
                    "subscription-event-map.csv"),
                new(
                    "Build renewal-risk account filter",
                    "Add a saved view for accounts with failed payments, declining usage, and open support escalations.",
                    TaskPriority.High,
                    TaskStatus.Open,
                    8,
                    "chloe.martin",
                    "sarah.kim",
                    "Customer success likes the risk categories. Let's add one filter for contracts expiring in 30 days.",
                    ["product", "frontend"]),
                new(
                    "Add invoice download audit event",
                    "Record who downloaded an invoice and when so finance can answer access questions quickly.",
                    TaskPriority.Medium,
                    TaskStatus.Done,
                    3,
                    "omar.hassan",
                    "ben.wilson",
                    "Audit entry is showing the invoice number and actor correctly in staging.",
                    ["backend", "security"]),
                new(
                    "Review usage chart empty states",
                    "Make low-data accounts feel intentional by showing setup guidance instead of blank usage charts.",
                    TaskPriority.Low,
                    TaskStatus.InReview,
                    6,
                    "jeremy.demo",
                    "chloe.martin",
                    "The empty state is much clearer. Please shorten the secondary line before design signoff.",
                    ["frontend", "product"]),
                new(
                    "QA billing webhook retries",
                    "Verify webhook retries after provider timeouts, duplicate events, and malformed payloads.",
                    TaskPriority.Critical,
                    TaskStatus.InProgress,
                    2,
                    "maya.singh",
                    "omar.hassan",
                    "Duplicate events are idempotent now. Timeout retry still needs one more staging run.",
                    ["qa", "backend"])
            ],
            Status: ProjectStatus.Planning,
            Files: ["launch-brief.pdf", "metric-definitions.xlsx", "finance-signoff.md"]),
        new(
            "Mobile Field Updates",
            "Improve mobile task updates for field teams with offline-friendly notes, attachments, and status sync.",
            ["jeremy.demo", "emily.carter", "jordan.nguyen", "amara.okafor", "ethan.wright", "daniel.roberts"],
            [
                new(
                    "Prototype offline comment queue",
                    "Queue task comments locally and submit them once the device regains a stable connection.",
                    TaskPriority.High,
                    TaskStatus.InProgress,
                    7,
                    "jordan.nguyen",
                    "amara.okafor",
                    "The prototype handles airplane mode well. We still need copy for when a comment is waiting to sync.",
                    ["frontend", "backend"]),
                new(
                    "Compress image attachments before upload",
                    "Reduce mobile attachment size while preserving enough quality for field documentation.",
                    TaskPriority.Medium,
                    TaskStatus.Open,
                    10,
                    "ethan.wright",
                    "emily.carter",
                    "Please test with screenshots and photos; the compression target may need to differ by file type.",
                    ["frontend", "ops"],
                    "attachment-compression-notes.md"),
                new(
                    "Review field-task card hierarchy",
                    "Make priority, assignee, due date, and sync state scannable for field users on small screens.",
                    TaskPriority.Medium,
                    TaskStatus.InReview,
                    4,
                    "emily.carter",
                    "jordan.nguyen",
                    "The new card order works well during walkthroughs. Sync state should stay close to the status pill.",
                    ["frontend", "product"]),
                new(
                    "Add sync conflict banner",
                    "Warn users when a task changed on another device before their queued update was submitted.",
                    TaskPriority.High,
                    TaskStatus.InProgress,
                    5,
                    "amara.okafor",
                    "daniel.roberts",
                    "Conflict copy is clear. QA needs a fixture that creates two edits within the same minute.",
                    ["frontend", "qa"]),
                new(
                    "Validate background refresh behavior",
                    "Confirm mobile views refresh task status without interrupting in-progress field notes.",
                    TaskPriority.High,
                    TaskStatus.Done,
                    1,
                    "daniel.roberts",
                    "jeremy.demo",
                    "Background refresh no longer clears draft notes. This is ready for the field pilot.",
                    ["qa", "frontend"])
            ],
            Status: ProjectStatus.OnHold,
            Files: ["product-brief.pdf", "offline-sync-spec.md", "field-test-plan.xlsx"]),
        new(
            "Partner Integrations Hub",
            "Centralize partner configuration, onboarding status, and integration health signals.",
            ["jeremy.demo", "marcus.lee", "nina.garcia", "lauren.brooks", "ben.wilson", "chloe.martin"],
            [
                new(
                    "Define partner onboarding states",
                    "Agree on the states partners move through from contract signed to production traffic enabled.",
                    TaskPriority.Medium,
                    TaskStatus.Done,
                    3,
                    "nina.garcia",
                    "lauren.brooks",
                    "The state names match partner success terminology. Implementation can use these labels directly.",
                    ["product", "ops"],
                    "partner-onboarding-states.pdf"),
                new(
                    "Build integration health summary",
                    "Show recent failures, stale credentials, and last successful payload in the partner detail view.",
                    TaskPriority.High,
                    TaskStatus.InProgress,
                    6,
                    "marcus.lee",
                    "ben.wilson",
                    "Health summary looks good with real payload data. Credential freshness still needs the new timestamp.",
                    ["backend", "frontend"]),
                new(
                    "Document webhook signing rotation",
                    "Write partner-facing docs for signing key rotation, overlap windows, and verification failures.",
                    TaskPriority.Medium,
                    TaskStatus.Open,
                    9,
                    "chloe.martin",
                    "marcus.lee",
                    "Please include a sample failed signature response so partners can test their alerting.",
                    ["docs", "security"]),
                new(
                    "Review failed payload replay flow",
                    "Make replay actions visible to support without exposing sensitive payload fields.",
                    TaskPriority.High,
                    TaskStatus.InReview,
                    5,
                    "lauren.brooks",
                    "nina.garcia",
                    "Support can find replay actions now. We need one more check on the masked payload preview.",
                    ["ops", "security"]),
                new(
                    "Add partner admin access checklist",
                    "Create a checklist for granting partner admins the minimum permissions needed for launch.",
                    TaskPriority.Low,
                    TaskStatus.InProgress,
                    7,
                    "ben.wilson",
                    "jeremy.demo",
                    "This checklist should sit in the launch runbook. Add the production credential owner field.",
                    ["security", "docs"])
            ],
            Status: ProjectStatus.Planning,
            Files: ["integration-overview.pdf", "partner-states.xlsx", "security-checklist.md"]),
        new(
            "Data Visibility Upgrade",
            "Improve reporting confidence with clearer dashboard metrics, activity filters, and export controls.",
            ["jeremy.demo", "sarah.kim", "priya.patel", "lauren.brooks", "maya.singh", "ethan.wright"],
            [
                new(
                    "Audit dashboard metric definitions",
                    "Review each dashboard total against source queries so support can explain differences to customers.",
                    TaskPriority.High,
                    TaskStatus.InProgress,
                    4,
                    "maya.singh",
                    "priya.patel",
                    "Open task and completed task totals match now. Overdue logic needs the timezone note in the tooltip.",
                    ["qa", "backend"]),
                new(
                    "Add project activity date filters",
                    "Let users filter project activity by this week, last 30 days, or a custom date range.",
                    TaskPriority.Medium,
                    TaskStatus.Open,
                    8,
                    "sarah.kim",
                    "lauren.brooks",
                    "The custom range is the most important one for customer reviews. Saved presets can come later.",
                    ["frontend", "product"]),
                new(
                    "Review CSV export columns",
                    "Confirm exported project, task, owner, status, and timestamp columns match the reporting contract.",
                    TaskPriority.Medium,
                    TaskStatus.InReview,
                    5,
                    "lauren.brooks",
                    "ethan.wright",
                    "Column order is good. Please rename Owner to Assignee so it matches the UI.",
                    ["ops", "docs"],
                    "reporting-export-columns.xlsx"),
                new(
                    "Validate member workload calculation",
                    "Check workload totals against assigned open tasks and in-progress tasks across shared projects.",
                    TaskPriority.High,
                    TaskStatus.InProgress,
                    6,
                    "priya.patel",
                    "maya.singh",
                    "The calculation is correct after excluding done tasks. Please add one test for unassigned work.",
                    ["backend", "qa"]),
                new(
                    "Draft reporting release notes",
                    "Prepare customer-facing release notes that explain the new filters and export changes.",
                    TaskPriority.Low,
                    TaskStatus.Open,
                    12,
                    "ethan.wright",
                    "sarah.kim",
                    "Mention the dashboard definition audit; customers have been asking how the totals are calculated.",
                    ["docs", "product"])
            ],
            Status: ProjectStatus.Completed,
            Files: ["reporting-brief.pdf", "export-contract.xlsx", "release-notes.md"]),
        new(
            "Security and Compliance Readiness",
            "Prepare project workflows for enterprise security reviews with clearer access, audit, and retention controls.",
            ["jeremy.demo", "daniel.roberts", "omar.hassan", "amara.okafor", "maya.singh", "chloe.martin"],
            [
                new(
                    "Review project-role permissions matrix",
                    "Confirm admin, member, and viewer permissions before enterprise access reviews begin.",
                    TaskPriority.Critical,
                    TaskStatus.InReview,
                    3,
                    "omar.hassan",
                    "daniel.roberts",
                    "The matrix matches the current API behavior. Viewer export permissions need a product decision.",
                    ["security", "docs"],
                    "project-role-permissions.xlsx"),
                new(
                    "Add access-review reminder task",
                    "Create a recurring task template for quarterly customer access reviews.",
                    TaskPriority.Medium,
                    TaskStatus.InProgress,
                    6,
                    "amara.okafor",
                    "chloe.martin",
                    "Reminder cadence is clear. Please add a due-date offset for customers with annual reviews.",
                    ["ops", "product"]),
                new(
                    "Document audit retention assumptions",
                    "Summarize what is retained, for how long, and which audit events are customer visible.",
                    TaskPriority.High,
                    TaskStatus.Open,
                    9,
                    "chloe.martin",
                    "omar.hassan",
                    "Security review will need the retention period called out explicitly in the first paragraph.",
                    ["security", "docs"]),
                new(
                    "QA member removal edge cases",
                    "Verify member removal with assigned tasks, comment history, viewer access, and project deletion.",
                    TaskPriority.High,
                    TaskStatus.InProgress,
                    2,
                    "maya.singh",
                    "daniel.roberts",
                    "Assigned tasks are unassigned correctly. I am still testing viewer access after removal.",
                    ["qa", "security"]),
                new(
                    "Prepare compliance evidence packet",
                    "Collect screenshots, audit examples, and endpoint summaries for the enterprise security questionnaire.",
                    TaskPriority.Medium,
                    TaskStatus.Done,
                    1,
                    "daniel.roberts",
                    "jeremy.demo",
                    "Evidence packet is ready for the first customer review. Keep the audit samples current after launch.",
                    ["security", "docs"])
            ],
            Files: ["compliance-overview.pdf", "permissions-matrix.xlsx", "evidence-index.md"])
    ];

    public static async Task InitializeAsync(ApplicationDbContext db, CancellationToken cancellationToken = default)
    {
        await db.Database.MigrateAsync(cancellationToken);
        if (await db.Projects.AnyAsync(cancellationToken))
        {
            return;
        }

        var users = TeamMembers
            .Select((member, index) =>
                index == 0
                    ? new User(DemoAdminUserId, member.Email, member.DisplayName)
                    : new User(member.Email, member.DisplayName))
            .ToList();

        await SeedWorkspaceAsync(db, users, cancellationToken);
    }

    public static async Task SeedDemoWorkspaceAsync(ApplicationDbContext db, Guid sessionUserId, CancellationToken cancellationToken = default)
    {
        var users = TeamMembers
            .Select((member, index) =>
                index == 0
                    ? new User(sessionUserId, DemoSessionConstants.SessionEmail(sessionUserId, member.LocalPart), member.DisplayName)
                    : new User(DemoSessionConstants.SessionEmail(sessionUserId, member.LocalPart), member.DisplayName))
            .ToList();

        await SeedWorkspaceAsync(db, users, cancellationToken);
    }

    private static async Task SeedWorkspaceAsync(
        ApplicationDbContext db,
        IReadOnlyList<User> users,
        CancellationToken cancellationToken)
    {
        db.Users.AddRange(users);
        await db.SaveChangesAsync(cancellationToken);

        var usersByLocalPart = TeamMembers
            .Select((member, index) => new { member.LocalPart, User = users[index] })
            .ToDictionary(entry => entry.LocalPart, entry => entry.User);

        var projectEntries = Projects
            .Select(projectSeed => new ProjectEntry(projectSeed, new Project(projectSeed.Name, projectSeed.Description, projectSeed.Status)))
            .ToList();

        db.Projects.AddRange(projectEntries.Select(entry => entry.Project));
        await db.SaveChangesAsync(cancellationToken);

        var now = DateTime.UtcNow;
        for (var p = 0; p < projectEntries.Count; p++)
        {
            var entry = projectEntries[p];
            var projectCreatedAt = now.AddDays(-56 + p * 2);
            SetCreatedAt(db, entry.Project, projectCreatedAt);
            AddProjectMembers(db, entry, usersByLocalPart, projectCreatedAt);
            AddProjectFiles(db, entry, usersByLocalPart, projectCreatedAt);
        }

        await db.SaveChangesAsync(cancellationToken);

        var labelsByProject = new Dictionary<Guid, Dictionary<string, Label>>();
        foreach (var entry in projectEntries)
        {
            var projectLabels = Labels
                .Select(labelSeed => new Label(entry.Project.Id, labelSeed.Name, labelSeed.Color))
                .ToDictionary(label => label.Name);

            labelsByProject[entry.Project.Id] = projectLabels;
            db.Labels.AddRange(projectLabels.Values);
        }

        await db.SaveChangesAsync(cancellationToken);

        var tasks = new List<TaskEntry>();
        foreach (var entry in projectEntries)
        {
            foreach (var taskSeed in entry.Seed.Tasks)
            {
                var task = new TaskItem(
                    entry.Project.Id,
                    taskSeed.Title,
                    taskSeed.Description,
                    taskSeed.Priority,
                    DateTime.UtcNow.Date.AddDays(taskSeed.DueInDays));

                ApplyDemoStatus(task, taskSeed.Status);

                if (taskSeed.AssigneeLocalPart is not null)
                {
                    task.Assign(usersByLocalPart[taskSeed.AssigneeLocalPart].Id);
                }

                tasks.Add(new TaskEntry(entry.Project, taskSeed, task));
            }
        }

        db.Tasks.AddRange(tasks.Select(entry => entry.Task));
        await db.SaveChangesAsync(cancellationToken);

        for (var o = 0; o < tasks.Count; o++)
        {
            AddTaskDetails(db, tasks[o], usersByLocalPart, labelsByProject[tasks[o].Project.Id], now, o);
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static void AddProjectMembers(
        ApplicationDbContext db,
        ProjectEntry entry,
        IReadOnlyDictionary<string, User> usersByLocalPart,
        DateTime projectCreatedAt)
    {
        foreach (var (localPart, index) in entry.Seed.MemberLocalParts.Select((localPart, index) => (localPart, index)))
        {
            var role = localPart == DemoSessionConstants.AdminEmailLocalPart || index == 1
                ? ProjectRole.Admin
                : index >= entry.Seed.MemberLocalParts.Length - 1
                    ? ProjectRole.Viewer
                    : ProjectRole.Member;

            db.ProjectMembers.Add(new ProjectMember(entry.Project.Id, usersByLocalPart[localPart].Id, role));
        }

        var admin = usersByLocalPart[DemoSessionConstants.AdminEmailLocalPart];
        var openedLog = new AuditLog(
            entry.Project.Id,
            null,
            admin.Id,
            AuditAction.Created,
            nameof(Project),
            $"{admin.DisplayName} opened the {entry.Project.Name} initiative and added the delivery team.");
        db.AuditLogs.Add(openedLog);
        SetCreatedAt(db, openedLog, projectCreatedAt);
    }

    private static void AddProjectFiles(
        ApplicationDbContext db,
        ProjectEntry entry,
        IReadOnlyDictionary<string, User> usersByLocalPart,
        DateTime projectCreatedAt)
    {
        var files = entry.Seed.Files;
        if (files is null || files.Length == 0)
        {
            return;
        }

        var filesAddedAt = projectCreatedAt.AddDays(1);
        foreach (var fileName in files)
        {
            var attachment = Attachment.ForProject(
                entry.Project.Id,
                fileName,
                ContentTypeFor(fileName),
                32_000 + fileName.Length * 900,
                $"demo/projects/{entry.Project.Id}/{fileName}");
            db.Attachments.Add(attachment);
            SetCreatedAt(db, attachment, filesAddedAt);
        }

        var admin = usersByLocalPart[DemoSessionConstants.AdminEmailLocalPart];
        var filesLog = new AuditLog(
            entry.Project.Id,
            null,
            admin.Id,
            AuditAction.Created,
            nameof(Attachment),
            $"{admin.DisplayName} added {files.Length} reference files to {entry.Project.Name}.");
        db.AuditLogs.Add(filesLog);
        SetCreatedAt(db, filesLog, filesAddedAt);
    }

    private static void AddTaskDetails(
        ApplicationDbContext db,
        TaskEntry entry,
        IReadOnlyDictionary<string, User> usersByLocalPart,
        IReadOnlyDictionary<string, Label> labelsByName,
        DateTime now,
        int ordinal)
    {
        var task = entry.Task;
        var seed = entry.Seed;
        var admin = usersByLocalPart[DemoSessionConstants.AdminEmailLocalPart];

        // Spread task history across the past so demo timestamps look realistic
        // (created weeks ago, edited days ago) instead of all reading "just now".
        var latest = now.AddHours(-2);
        var createdAt = now.AddDays(-45 + ordinal).AddHours(-(ordinal * 7 % 41));
        var assignedAt = Min(createdAt.AddMinutes(25 + ordinal % 40), latest);
        var statusAt = Min(createdAt.AddDays(1 + ordinal % 4).AddHours(ordinal % 13), latest);
        DateTime? lastTouch = null;

        SetCreatedAt(db, task, createdAt);

        var createdLog = new AuditLog(entry.Project.Id, task.Id, admin.Id, AuditAction.Created,
            nameof(TaskItem), $"{admin.DisplayName} created \"{task.Title}\" for {entry.Project.Name}.");
        db.AuditLogs.Add(createdLog);
        SetCreatedAt(db, createdLog, createdAt);

        if (seed.AssigneeLocalPart is not null)
        {
            var assignee = usersByLocalPart[seed.AssigneeLocalPart];
            var assignedLog = new AuditLog(entry.Project.Id, task.Id, admin.Id, AuditAction.Assigned,
                nameof(TaskItem), $"{admin.DisplayName} assigned \"{task.Title}\" to {assignee.DisplayName}.");
            db.AuditLogs.Add(assignedLog);
            SetCreatedAt(db, assignedLog, assignedAt);
            lastTouch = assignedAt;
        }

        if (seed.Status != TaskStatus.Open)
        {
            var actor = seed.AssigneeLocalPart is not null ? usersByLocalPart[seed.AssigneeLocalPart] : admin;
            var statusLog = new AuditLog(entry.Project.Id, task.Id, actor.Id, AuditAction.StatusChanged,
                nameof(TaskItem), $"{actor.DisplayName} moved \"{task.Title}\" to {FormatStatus(seed.Status)}.");
            db.AuditLogs.Add(statusLog);
            SetCreatedAt(db, statusLog, statusAt);
            lastTouch = statusAt;
        }

        if (lastTouch.HasValue)
        {
            SetUpdatedAt(db, task, lastTouch.Value);
        }

        var commentAt = Min((lastTouch ?? createdAt).AddHours(3 + ordinal % 9), latest);
        var commentAuthor = usersByLocalPart[seed.CommentAuthorLocalPart];
        var comment = new Comment(task.Id, commentAuthor.Id, seed.Comment);
        db.Comments.Add(comment);
        SetCreatedAt(db, comment, commentAt);
        var commentLog = new AuditLog(entry.Project.Id, task.Id, commentAuthor.Id, AuditAction.CommentAdded,
            nameof(Comment), $"{commentAuthor.DisplayName} commented on \"{task.Title}\".");
        db.AuditLogs.Add(commentLog);
        SetCreatedAt(db, commentLog, commentAt);

        foreach (var labelName in seed.LabelNames)
        {
            db.TaskLabels.Add(new TaskLabel(task.Id, labelsByName[labelName].Id));
        }

        if (seed.AttachmentFileName is not null)
        {
            var attachment = new Attachment(
                task.Id,
                seed.AttachmentFileName,
                ContentTypeFor(seed.AttachmentFileName),
                48_000 + seed.AttachmentFileName.Length * 1_024,
                $"demo/tasks/{task.Id}/{seed.AttachmentFileName}");
            db.Attachments.Add(attachment);
            SetCreatedAt(db, attachment, createdAt.AddHours(2));
        }
    }

    private static DateTime Min(DateTime a, DateTime b) => a < b ? a : b;

    private static void SetCreatedAt(ApplicationDbContext db, object entity, DateTime whenUtc) =>
        db.Entry(entity).Property("CreatedAtUtc").CurrentValue = whenUtc;

    private static void SetUpdatedAt(ApplicationDbContext db, object entity, DateTime whenUtc) =>
        db.Entry(entity).Property("UpdatedAtUtc").CurrentValue = whenUtc;

    private static string ContentTypeFor(string fileName)
    {
        if (fileName.EndsWith(".png", StringComparison.OrdinalIgnoreCase))
        {
            return "image/png";
        }

        if (fileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
        {
            return "application/json";
        }

        if (fileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
        {
            return "text/csv";
        }

        if (fileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
        {
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        }

        if (fileName.EndsWith(".md", StringComparison.OrdinalIgnoreCase))
        {
            return "text/markdown";
        }

        return "application/pdf";
    }

    private static string FormatStatus(TaskStatus status) => status switch
    {
        TaskStatus.InProgress => "In Progress",
        TaskStatus.InReview => "In Review",
        _ => status.ToString()
    };

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

    private sealed record UserSeed(string LocalPart, string DisplayName)
    {
        public string Email => $"{LocalPart}@{DemoSessionConstants.EmailDomain}";
    }

    private sealed record LabelSeed(string Name, string Color);

    private sealed record ProjectSeed(
        string Name,
        string Description,
        string[] MemberLocalParts,
        TaskSeed[] Tasks,
        ProjectStatus Status = ProjectStatus.Active,
        string[]? Files = null);

    private sealed record TaskSeed(
        string Title,
        string Description,
        TaskPriority Priority,
        TaskStatus Status,
        int DueInDays,
        string? AssigneeLocalPart,
        string CommentAuthorLocalPart,
        string Comment,
        string[] LabelNames,
        string? AttachmentFileName = null);

    private sealed record ProjectEntry(ProjectSeed Seed, Project Project);

    private sealed record TaskEntry(Project Project, TaskSeed Seed, TaskItem Task);
}
