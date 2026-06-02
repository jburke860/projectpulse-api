using ProjectPulse.Domain.Common;

namespace ProjectPulse.Domain.Entities;

public class Comment : BaseEntity
{
    public Guid TaskId { get; private set; }
    public TaskItem Task { get; private set; } = null!;
    public Guid AuthorId { get; private set; }
    public User Author { get; private set; } = null!;
    public string Body { get; private set; } = string.Empty;

    private Comment()
    {
    }

    public Comment(Guid taskId, Guid authorId, string body)
    {
        TaskId = taskId;
        AuthorId = authorId;
        Body = body;
    }
}
