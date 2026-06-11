using ProjectPulse.Application.Demo.Dtos;

namespace ProjectPulse.Application.Common.Interfaces;

public interface IDemoSessionService
{
    Task<DemoSessionDto> CreateAsync(CancellationToken cancellationToken = default);
}
