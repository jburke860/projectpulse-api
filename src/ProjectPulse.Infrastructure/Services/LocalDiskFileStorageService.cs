using ProjectPulse.Application.Common.Interfaces;

namespace ProjectPulse.Infrastructure.Services;

public class LocalDiskFileStorageService : IFileStorageService
{
    private readonly string _rootPath;

    public LocalDiskFileStorageService(FileStorageOptions options)
    {
        _rootPath = Path.GetFullPath(options.RootPath);
    }

    public async Task<string> SaveAsync(Guid taskId, string fileName, Stream content, CancellationToken cancellationToken = default)
    {
        // Storage keys are always server-generated; the client filename only survives in the database.
        var extension = Path.GetExtension(fileName);
        var storageKey = $"tasks/{taskId}/{Guid.NewGuid():N}{extension}";

        var fullPath = ResolveSafePath(storageKey);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await using var fileStream = File.Create(fullPath);
        await content.CopyToAsync(fileStream, cancellationToken);

        return storageKey;
    }

    public Task<Stream?> OpenReadAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        var fullPath = ResolveSafePath(storageKey);
        return Task.FromResult<Stream?>(File.Exists(fullPath) ? File.OpenRead(fullPath) : null);
    }

    public Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        var fullPath = ResolveSafePath(storageKey);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }

    private string ResolveSafePath(string storageKey)
    {
        var fullPath = Path.GetFullPath(Path.Combine(_rootPath, storageKey));
        if (!fullPath.StartsWith(_rootPath, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Storage key resolves outside the attachment root.");
        }

        return fullPath;
    }
}
