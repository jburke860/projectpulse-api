namespace ProjectPulse.Application.Common.Models;

public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize)
{
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => Page < TotalPages;
}

public static class Paging
{
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 100;

    public static (int Page, int PageSize) Clamp(
        int? page,
        int? pageSize,
        int defaultPageSize = DefaultPageSize,
        int maxPageSize = MaxPageSize)
    {
        var clampedPage = Math.Max(page ?? 1, 1);
        var clampedSize = pageSize ?? defaultPageSize;
        if (clampedSize < 1)
        {
            clampedSize = defaultPageSize;
        }

        return (clampedPage, Math.Min(clampedSize, maxPageSize));
    }
}
