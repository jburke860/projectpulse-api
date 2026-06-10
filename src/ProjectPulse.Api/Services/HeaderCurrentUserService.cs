using ProjectPulse.Application.Common.Constants;
using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Infrastructure.Persistence;

namespace ProjectPulse.Api.Services;

public class HeaderCurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HeaderCurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid UserId
    {
        get
        {
            var sessionId = _httpContextAccessor.HttpContext?.Request.Headers[DemoSessionConstants.HeaderName].FirstOrDefault();
            return Guid.TryParse(sessionId, out var userId) ? userId : SeedData.DemoAdminUserId;
        }
    }
}
