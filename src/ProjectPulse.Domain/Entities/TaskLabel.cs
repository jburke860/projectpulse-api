namespace ProjectPulse.Domain.Entities;

public class TaskLabel
{
    public Guid TaskId { get; private set; }
    public TaskItem Task { get; private set; } = null!;
    public Guid LabelId { get; private set; }
    public Label Label { get; private set; } = null!;

    private TaskLabel()
    {
    }

    public TaskLabel(Guid taskId, Guid labelId)
    {
        TaskId = taskId;
        LabelId = labelId;
    }
}
