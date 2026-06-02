namespace ProjectPulse.Application.Common.Models;

public class ApiResult<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Message { get; init; }
    public IEnumerable<string> Errors { get; init; } = [];

    public static ApiResult<T> Ok(T data, string? message = null) =>
        new() { Success = true, Data = data, Message = message };

    public static ApiResult<T> Fail(IEnumerable<string> errors, string? message = null) =>
        new() { Success = false, Errors = errors, Message = message };
}
