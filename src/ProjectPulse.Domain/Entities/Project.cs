using ProjectPulse.Domain.Common;
using ProjectPulse.Domain.Enums;

namespace ProjectPulse.Domain.Entities;

public class Project : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public ProjectStatus Status { get; private set; } = ProjectStatus.Active;
    public string? Icon { get; private set; }
    public string? Color { get; private set; }

    public ICollection<ProjectMember> Members { get; private set; } = [];
    public ICollection<TaskItem> Tasks { get; private set; } = [];
    public ICollection<Label> Labels { get; private set; } = [];
    public ICollection<Attachment> Attachments { get; private set; } = [];
    public ICollection<AuditLog> AuditLogs { get; private set; } = [];

    private Project()
    {
    }

    public Project(string name, string? description = null, ProjectStatus status = ProjectStatus.Active, string? icon = null, string? color = null)
    {
        Name = name;
        Description = description;
        Status = status;
        Icon = icon;
        Color = color;
    }

    public void Update(string name, string? description, ProjectStatus status, string? icon = null, string? color = null)
    {
        Name = name;
        Description = description;
        Status = status;
        // Appearance is kept when omitted so status-only updates never wipe it.
        if (icon is not null)
        {
            Icon = icon;
        }

        if (color is not null)
        {
            Color = color;
        }

        Touch();
    }
}
