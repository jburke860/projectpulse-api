using ProjectPulse.Domain.Common;

namespace ProjectPulse.Domain.Entities;

public class Project : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }

    public ICollection<ProjectMember> Members { get; private set; } = [];
    public ICollection<TaskItem> Tasks { get; private set; } = [];
    public ICollection<Label> Labels { get; private set; } = [];
    public ICollection<AuditLog> AuditLogs { get; private set; } = [];

    private Project()
    {
    }

    public Project(string name, string? description = null)
    {
        Name = name;
        Description = description;
    }

    public void Update(string name, string? description)
    {
        Name = name;
        Description = description;
        Touch();
    }
}
