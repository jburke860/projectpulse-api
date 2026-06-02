using ProjectPulse.Domain.Common;

namespace ProjectPulse.Domain.Entities;

public class Label : BaseEntity
{
    public Guid ProjectId { get; private set; }
    public Project Project { get; private set; } = null!;
    public string Name { get; private set; } = string.Empty;
    public string Color { get; private set; } = "#6366f1";

    public ICollection<TaskLabel> TaskLabels { get; private set; } = [];

    private Label()
    {
    }

    public Label(Guid projectId, string name, string color)
    {
        ProjectId = projectId;
        Name = name;
        Color = color;
    }
}
