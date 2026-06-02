using FluentAssertions;
using ProjectPulse.Domain.Entities;
using ProjectPulse.Domain.Exceptions;
using TaskPriority = ProjectPulse.Domain.Enums.TaskPriority;
using TaskStatus = ProjectPulse.Domain.Enums.TaskStatus;

namespace ProjectPulse.UnitTests.Domain;

public class TaskItemTests
{
    [Fact]
    public void Constructor_RejectsPastDueDate()
    {
        var act = () => new TaskItem(Guid.NewGuid(), "Title", null, TaskPriority.Medium, DateTime.UtcNow.AddDays(-1));
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void ChangeStatus_AllowsValidWorkflow()
    {
        var task = new TaskItem(Guid.NewGuid(), "Title", null, TaskPriority.High, DateTime.UtcNow.AddDays(3));
        task.ChangeStatus(TaskStatus.InProgress);
        task.Status.Should().Be(TaskStatus.InProgress);
    }
}
