namespace ProjectPulse.Application.Common.Constants;

public static class DemoSessionConstants
{
    public const string HeaderName = "X-ProjectPulse-Demo-Session";
    public const string EmailDomain = "projectpulse.local";
    public const string AdminEmailLocalPart = "jeremy.demo";
    public const int LifetimeHours = 72;

    public static string EmailSessionCode(Guid sessionId) => sessionId.ToString("N")[..8];

    public static string EmailSessionSuffix(Guid sessionId) => $".{EmailSessionCode(sessionId)}@{EmailDomain}";

    public static string SessionEmail(Guid sessionId, string localPart) =>
        $"{localPart}.{EmailSessionCode(sessionId)}@{EmailDomain}";
}
