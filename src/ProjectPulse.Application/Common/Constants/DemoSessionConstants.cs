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

    public static string PublicDemoEmail(string email)
    {
        const int sessionCodeLength = 8;
        const string domainSuffix = $"@{EmailDomain}";

        if (!email.EndsWith(domainSuffix, StringComparison.OrdinalIgnoreCase))
        {
            return email;
        }

        var atIndex = email.LastIndexOf('@');
        if (atIndex <= 0)
        {
            return email;
        }

        var dotIndex = email.LastIndexOf('.', atIndex - 1);

        if (dotIndex < 0)
        {
            return email;
        }

        var sessionCode = email[(dotIndex + 1)..atIndex];
        if (sessionCode.Length != sessionCodeLength || !sessionCode.All(Uri.IsHexDigit))
        {
            return email;
        }

        return $"{email[..dotIndex]}{email[atIndex..]}";
    }
}
