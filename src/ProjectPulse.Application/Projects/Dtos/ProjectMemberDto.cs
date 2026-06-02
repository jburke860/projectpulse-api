namespace ProjectPulse.Application.Projects.Dtos;

public record ProjectMemberDto(Guid UserId, string DisplayName, string Email, string Role);
