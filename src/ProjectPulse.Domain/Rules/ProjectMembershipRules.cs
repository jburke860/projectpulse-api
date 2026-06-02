using ProjectPulse.Domain.Enums;

namespace ProjectPulse.Domain.Rules;

public static class ProjectMembershipRules
{
    public static bool CanManageTasks(ProjectRole role) => role is ProjectRole.Admin or ProjectRole.Member;

    public static bool CanManageMembers(ProjectRole role) => role == ProjectRole.Admin;

    public static void EnsureCanManageTasks(ProjectRole role)
    {
        if (!CanManageTasks(role))
        {
            throw new Exceptions.DomainException("Only project admins and members can manage tasks.");
        }
    }
}
