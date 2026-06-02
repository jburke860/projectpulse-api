using ProjectPulse.Domain.Common;

namespace ProjectPulse.Domain.Entities;

public class Attachment : BaseEntity
{
    public Guid TaskId { get; private set; }
    public TaskItem Task { get; private set; } = null!;
    public string FileName { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public long SizeBytes { get; private set; }
    public string StorageKey { get; private set; } = string.Empty;

    private Attachment()
    {
    }

    public Attachment(Guid taskId, string fileName, string contentType, long sizeBytes, string storageKey)
    {
        TaskId = taskId;
        FileName = fileName;
        ContentType = contentType;
        SizeBytes = sizeBytes;
        StorageKey = storageKey;
    }
}
