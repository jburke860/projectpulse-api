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
}
