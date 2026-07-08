namespace ProjectPulse.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveAsync(Guid taskId, string fileName, Stream content, CancellationToken cancellationToken = default);
    Task<Stream?> OpenReadAsync(string storageKey, CancellationToken cancellationToken = default);
    Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default);
}
