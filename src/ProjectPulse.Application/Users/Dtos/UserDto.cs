namespace ProjectPulse.Application.Users.Dtos;

public record UserDto(
    Guid Id,
    string DisplayName,
    string Email,
    int ProjectCount,
    int AssignedTaskCount,
    string? AvatarColor = null);

public record UpdateProfileRequest(string DisplayName, string? AvatarColor = null);
