using FluentAssertions;
using ProjectPulse.Application.Projects.Commands;
using ProjectPulse.Application.Projects.Dtos;

namespace ProjectPulse.UnitTests.Application;

public class UpdateProjectCommandValidatorTests
{
    private static UpdateProjectCommand Command(string name, string status) =>
        new(Guid.NewGuid(), new UpdateProjectRequest(name, null, status));

    [Fact]
    public void Should_Fail_When_Name_Is_Empty()
    {
        var validator = new UpdateProjectCommandValidator();
        validator.Validate(Command("", "Active")).IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("")]
    [InlineData("NotAStatus")]
    public void Should_Fail_When_Status_Is_Invalid(string status)
    {
        var validator = new UpdateProjectCommandValidator();
        validator.Validate(Command("Project", status)).IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("Planning")]
    [InlineData("Active")]
    [InlineData("onhold")]
    [InlineData("Completed")]
    public void Should_Pass_For_Valid_Status(string status)
    {
        var validator = new UpdateProjectCommandValidator();
        validator.Validate(Command("Project", status)).IsValid.Should().BeTrue();
    }
}
