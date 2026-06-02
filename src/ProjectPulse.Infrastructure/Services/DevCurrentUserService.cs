using ProjectPulse.Application.Common.Interfaces;
using ProjectPulse.Infrastructure.Persistence;

namespace ProjectPulse.Infrastructure.Services;

public class DevCurrentUserService : ICurrentUserService
{
    public Guid UserId => SeedData.DemoAdminUserId;
}
