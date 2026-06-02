using TaskStatus = ProjectPulse.Domain.Enums.TaskStatus;

namespace ProjectPulse.Domain.Rules;

public static class TaskStatusTransitionRules
{
    private static readonly IReadOnlyDictionary<TaskStatus, HashSet<TaskStatus>> AllowedTransitions =
        new Dictionary<TaskStatus, HashSet<TaskStatus>>
        {
            [TaskStatus.Open] = [TaskStatus.InProgress, TaskStatus.Cancelled],
            [TaskStatus.InProgress] = [TaskStatus.InReview, TaskStatus.Open, TaskStatus.Cancelled],
            [TaskStatus.InReview] = [TaskStatus.Done, TaskStatus.InProgress, TaskStatus.Cancelled],
            [TaskStatus.Done] = [],
            [TaskStatus.Cancelled] = [TaskStatus.Open]
        };

    public static bool CanTransition(TaskStatus from, TaskStatus to) =>
        from == to || (AllowedTransitions.TryGetValue(from, out var next) && next.Contains(to));

    public static void EnsureCanTransition(TaskStatus from, TaskStatus to)
    {
        if (!CanTransition(from, to))
        {
            throw new Exceptions.DomainException($"Cannot transition task from {from} to {to}.");
        }
    }
}
