using FluentAssertions;
using ProjectPulse.Domain.Enums;
using ProjectPulse.Domain.Exceptions;
using ProjectPulse.Domain.Rules;

namespace ProjectPulse.UnitTests.Domain;

public class ProjectMembershipRulesTests
{
    [Theory]
    [InlineData(ProjectRole.Admin, true)]
    [InlineData(ProjectRole.Member, true)]
    [InlineData(ProjectRole.Viewer, false)]
    public void CanManageTasks_ReturnsExpected(ProjectRole role, bool expected)
    {
        ProjectMembershipRules.CanManageTasks(role).Should().Be(expected);
    }

    [Fact]
    public void EnsureCanManageTasks_ThrowsForViewer()
    {
        var act = () => ProjectMembershipRules.EnsureCanManageTasks(ProjectRole.Viewer);
        act.Should().Throw<DomainException>();
    }
}
