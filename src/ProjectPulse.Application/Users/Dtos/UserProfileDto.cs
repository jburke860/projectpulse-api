using ProjectPulse.Application.Audit.Dtos;

namespace ProjectPulse.Application.Users.Dtos;

public record UserProfileMembershipDto(
    Guid ProjectId,
    string ProjectName,
    string ProjectStatus,
    string Role,
    string? Icon,
    string? Color);

public record UserProfileDto(
    Guid Id,
    string DisplayName,
    string Email,
    string? AvatarColor,
    DateTime JoinedAtUtc,
    int ActiveTaskCount,
    int CompletedTaskCount,
    int OverdueTaskCount,
    IReadOnlyList<UserProfileMembershipDto> Memberships,
    IReadOnlyList<AuditLogDto> RecentActivity);
