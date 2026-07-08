using FluentAssertions;
using ProjectPulse.Application.Tasks.Commands;

namespace ProjectPulse.UnitTests.Application;

public class UploadAttachmentCommandValidatorTests
{
    private static UploadAttachmentCommand Command(string fileName, long sizeBytes) =>
        new(Guid.NewGuid(), fileName, "application/octet-stream", sizeBytes, Stream.Null);

    [Fact]
    public void Should_Pass_For_Allowed_File_Within_Limit()
    {
        var validator = new UploadAttachmentCommandValidator();
        validator.Validate(Command("notes.png", 1024)).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Should_Fail_When_File_Exceeds_Size_Limit()
    {
        var validator = new UploadAttachmentCommandValidator();
        validator.Validate(Command("big.png", UploadAttachmentCommandValidator.MaxSizeBytes + 1))
            .IsValid.Should().BeFalse();
    }

    [Fact]
    public void Should_Fail_When_File_Is_Empty()
    {
        var validator = new UploadAttachmentCommandValidator();
        validator.Validate(Command("empty.png", 0)).IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("malware.exe")]
    [InlineData("script.sh")]
    [InlineData("no-extension")]
    public void Should_Fail_For_Disallowed_Extensions(string fileName)
    {
        var validator = new UploadAttachmentCommandValidator();
        validator.Validate(Command(fileName, 1024)).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Should_Fail_When_FileName_Is_Empty()
    {
        var validator = new UploadAttachmentCommandValidator();
        validator.Validate(Command("", 1024)).IsValid.Should().BeFalse();
    }
}
