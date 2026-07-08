using FluentAssertions;
using ProjectPulse.Application.Projects.Commands;
using ProjectPulse.Application.Projects.Dtos;

namespace ProjectPulse.UnitTests.Application;

public class CreateProjectCommandValidatorTests
{
    [Fact]
    public void Should_Fail_When_Name_Is_Empty()
    {
        var validator = new CreateProjectCommandValidator();
        var result = validator.Validate(new CreateProjectCommand(new CreateProjectRequest("", null)));
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Should_Fail_When_Status_Is_Unknown()
    {
        var validator = new CreateProjectCommandValidator();
        var result = validator.Validate(new CreateProjectCommand(new CreateProjectRequest("Project", null, "NotAStatus")));
        result.IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("Planning")]
    [InlineData("active")]
    [InlineData("OnHold")]
    [InlineData("Completed")]
    public void Should_Pass_For_Missing_Or_Valid_Status(string? status)
    {
        var validator = new CreateProjectCommandValidator();
        var result = validator.Validate(new CreateProjectCommand(new CreateProjectRequest("Project", null, status)));
        result.IsValid.Should().BeTrue();
    }
}
