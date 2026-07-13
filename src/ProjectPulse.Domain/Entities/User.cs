using ProjectPulse.Domain.Common;

namespace ProjectPulse.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; private set; } = string.Empty;
    public string DisplayName { get; private set; } = string.Empty;
    public string? AvatarColor { get; private set; }

    public ICollection<ProjectMember> Memberships { get; private set; } = [];
    public ICollection<TaskItem> AssignedTasks { get; private set; } = [];

    private User()
    {
    }

    public User(string email, string displayName)
    {
        Email = email;
        DisplayName = displayName;
    }

    public User(Guid id, string email, string displayName) : this(email, displayName)
    {
        Id = id;
    }

    public void UpdateProfile(string displayName, string? avatarColor = null)
    {
        DisplayName = displayName;
        if (avatarColor is not null)
        {
            AvatarColor = avatarColor;
        }

        Touch();
    }
}
