using FluentAssertions;
using ProjectPulse.Application.Common.Constants;

namespace ProjectPulse.UnitTests.Application;

public class DemoSessionConstantsTests
{
    [Fact]
    public void PublicDemoEmail_Strips_Session_Code_From_ProjectPulse_Email()
    {
        var sessionId = Guid.Parse("2f1c93a4-77b6-4b6d-9c77-8ab18422d317");
        var email = DemoSessionConstants.SessionEmail(sessionId, "sarah.kim");

        var result = DemoSessionConstants.PublicDemoEmail(email);

        result.Should().Be("sarah.kim@projectpulse.local");
    }

    [Theory]
    [InlineData("jeremy.demo@projectpulse.local")]
    [InlineData("sarah.kim.notasession@projectpulse.local")]
    [InlineData("sarah.kim.1234567@projectpulse.local")]
    [InlineData("sarah.kim.12345678@example.com")]
    public void PublicDemoEmail_Leaves_Non_Session_Email_Unchanged(string email)
    {
        DemoSessionConstants.PublicDemoEmail(email).Should().Be(email);
    }
}
