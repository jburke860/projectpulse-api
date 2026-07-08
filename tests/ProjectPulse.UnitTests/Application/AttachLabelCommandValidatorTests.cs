using FluentAssertions;
using ProjectPulse.Application.Tasks.Commands;
using ProjectPulse.Application.Tasks.Dtos;

namespace ProjectPulse.UnitTests.Application;

public class AttachLabelCommandValidatorTests
{
    [Fact]
    public void Should_Fail_When_LabelId_Is_Empty()
    {
        var validator = new AttachLabelCommandValidator();
        var result = validator.Validate(new AttachLabelCommand(Guid.NewGuid(), new AttachLabelRequest(Guid.Empty)));
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Should_Pass_For_Valid_Ids()
    {
        var validator = new AttachLabelCommandValidator();
        var result = validator.Validate(new AttachLabelCommand(Guid.NewGuid(), new AttachLabelRequest(Guid.NewGuid())));
        result.IsValid.Should().BeTrue();
    }
}
