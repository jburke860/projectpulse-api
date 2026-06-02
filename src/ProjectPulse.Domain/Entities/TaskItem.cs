using ProjectPulse.Domain.Common;
using ProjectPulse.Domain.Enums;
using ProjectPulse.Domain.Rules;
using TaskStatus = ProjectPulse.Domain.Enums.TaskStatus;

namespace ProjectPulse.Domain.Entities;

public class TaskItem : BaseEntity
{
    public Guid ProjectId { get; private set; }
    public Project Project { get; private set; } = null!;
    public string Title { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public TaskStatus Status { get; private set; } = TaskStatus.Open;
    public TaskPriority Priority { get; private set; } = TaskPriority.Medium;
    public DateTime? DueDateUtc { get; private set; }
    public Guid? AssigneeId { get; private set; }
    public User? Assignee { get; private set; }

    public ICollection<Comment> Comments { get; private set; } = [];
    public ICollection<TaskLabel> TaskLabels { get; private set; } = [];
    public ICollection<Attachment> Attachments { get; private set; } = [];

    private TaskItem()
    {
    }

    public TaskItem(Guid projectId, string title, string? description, TaskPriority priority, DateTime? dueDateUtc)
    {
        ProjectId = projectId;
        Title = title;
        Description = description;
        Priority = priority;
        DueDateUtc = dueDateUtc;
        ValidateDueDate(dueDateUtc);
    }

    public void Update(string title, string? description, TaskPriority priority, DateTime? dueDateUtc)
    {
        Title = title;
        Description = description;
        Priority = priority;
        DueDateUtc = dueDateUtc;
        ValidateDueDate(dueDateUtc);
        Touch();
    }

    public void ChangeStatus(TaskStatus newStatus)
    {
        TaskStatusTransitionRules.EnsureCanTransition(Status, newStatus);
        Status = newStatus;
        Touch();
    }

    public void Assign(Guid? assigneeId)
    {
        AssigneeId = assigneeId;
        Touch();
    }

    private static void ValidateDueDate(DateTime? dueDateUtc)
    {
        if (dueDateUtc.HasValue && dueDateUtc.Value.Date < DateTime.UtcNow.Date)
        {
            throw new Exceptions.DomainException("Due date cannot be in the past.");
        }
    }
}
