using ProjectPulse.Domain.Common;
using ProjectPulse.Domain.Enums;

namespace ProjectPulse.Domain.Entities;

public class Project : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public ProjectStatus Status { get; private set; } = ProjectStatus.Active;

    public ICollection<ProjectMember> Members { get; private set; } = [];
    public ICollection<TaskItem> Tasks { get; private set; } = [];
    public ICollection<Label> Labels { get; private set; } = [];
    public ICollection<Attachment> Attachments { get; private set; } = [];
    public ICollection<AuditLog> AuditLogs { get; private set; } = [];

    private Project()
    {
    }

    public Project(string name, string? description = null, ProjectStatus status = ProjectStatus.Active)
    {
        Name = name;
        Description = description;
        Status = status;
    }

    public void Update(string name, string? description, ProjectStatus status)
    {
        Name = name;
        Description = description;
        Status = status;
        Touch();
    }
}
