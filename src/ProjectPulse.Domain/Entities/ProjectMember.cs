using ProjectPulse.Domain.Common;
using ProjectPulse.Domain.Enums;

namespace ProjectPulse.Domain.Entities;

public class ProjectMember : BaseEntity
{
    public Guid ProjectId { get; private set; }
    public Project Project { get; private set; } = null!;
    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;
    public ProjectRole Role { get; private set; }

    private ProjectMember()
    {
    }

    public ProjectMember(Guid projectId, Guid userId, ProjectRole role)
    {
        ProjectId = projectId;
        UserId = userId;
        Role = role;
    }

    public void ChangeRole(ProjectRole role)
    {
        Role = role;
        Touch();
    }
}
