using System.Net;
using System.Text.Json;
using FluentValidation;
using ProjectPulse.Application.Common.Exceptions;
using ProjectPulse.Application.Common.Models;
using ProjectPulse.Domain.Exceptions;

namespace ProjectPulse.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        _logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);

        var (statusCode, response) = exception switch
        {
            NotFoundException notFound => (HttpStatusCode.NotFound, ApiResult<object>.Fail([notFound.Message], "Not found")),
            Application.Common.Exceptions.ValidationException validation => (HttpStatusCode.BadRequest, ApiResult<object>.Fail(validation.Errors.SelectMany(e => e.Value), "Validation failed")),
            DomainException domain => (HttpStatusCode.BadRequest, ApiResult<object>.Fail([domain.Message], "Domain rule violation")),
            FluentValidation.ValidationException fv => (HttpStatusCode.BadRequest, ApiResult<object>.Fail(fv.Errors.Select(e => e.ErrorMessage), "Validation failed")),
            _ => (HttpStatusCode.InternalServerError, ApiResult<object>.Fail(["An unexpected error occurred."], "Server error"))
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
}
