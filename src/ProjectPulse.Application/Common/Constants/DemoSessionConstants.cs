namespace ProjectPulse.Application.Common.Constants;

public static class DemoSessionConstants
{
    public const string HeaderName = "X-ProjectPulse-Demo-Session";
    public const string EmailPrefix = "demo+";
    public const string EmailDomain = "projectpulse.local";
    public const int LifetimeHours = 72;

    public static string EmailSessionPrefix(Guid sessionId) => $"{EmailPrefix}{sessionId:N}.";
}
