using FluentAssertions;
using ProjectPulse.Domain.Entities;
using ProjectPulse.Domain.Enums;

namespace ProjectPulse.UnitTests.Domain;

public class ProjectTests
{
    [Fact]
    public void New_Project_Defaults_To_Active()
    {
        var project = new Project("Portfolio site");
        project.Status.Should().Be(ProjectStatus.Active);
    }

    [Fact]
    public void Constructor_Accepts_Explicit_Status()
    {
        var project = new Project("Portfolio site", null, ProjectStatus.Planning);
        project.Status.Should().Be(ProjectStatus.Planning);
    }

    [Fact]
    public void Update_Changes_Fields_And_Touches_Timestamp()
    {
        var project = new Project("Old name", "Old description");
        project.UpdatedAtUtc.Should().BeNull();

        project.Update("New name", "New description", ProjectStatus.Completed);

        project.Name.Should().Be("New name");
        project.Description.Should().Be("New description");
        project.Status.Should().Be(ProjectStatus.Completed);
        project.UpdatedAtUtc.Should().NotBeNull();
    }
}
