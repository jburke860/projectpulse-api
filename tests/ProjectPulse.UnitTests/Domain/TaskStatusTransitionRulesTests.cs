using FluentAssertions;
using ProjectPulse.Domain.Enums;
using ProjectPulse.Domain.Exceptions;
using ProjectPulse.Domain.Rules;
using TaskStatus = ProjectPulse.Domain.Enums.TaskStatus;

namespace ProjectPulse.UnitTests.Domain;

public class TaskStatusTransitionRulesTests
{
    [Theory]
    [InlineData(TaskStatus.Open, TaskStatus.InProgress, true)]
    [InlineData(TaskStatus.Open, TaskStatus.Done, false)]
    [InlineData(TaskStatus.InProgress, TaskStatus.InReview, true)]
    [InlineData(TaskStatus.InReview, TaskStatus.Done, true)]
    [InlineData(TaskStatus.Done, TaskStatus.Open, false)]
    public void CanTransition_ReturnsExpected(TaskStatus from, TaskStatus to, bool expected)
    {
        TaskStatusTransitionRules.CanTransition(from, to).Should().Be(expected);
    }

    [Fact]
    public void EnsureCanTransition_ThrowsForInvalidTransition()
    {
        var act = () => TaskStatusTransitionRules.EnsureCanTransition(TaskStatus.Open, TaskStatus.Done);
        act.Should().Throw<DomainException>();
    }
}
