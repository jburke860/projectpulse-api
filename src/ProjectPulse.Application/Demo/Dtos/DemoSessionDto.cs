namespace ProjectPulse.Application.Demo.Dtos;

public record DemoSessionDto(string SessionId, Guid UserId, DateTime ExpiresAtUtc);
