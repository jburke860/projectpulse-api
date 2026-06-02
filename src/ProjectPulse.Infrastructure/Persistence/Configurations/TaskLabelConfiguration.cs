using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProjectPulse.Domain.Entities;

namespace ProjectPulse.Infrastructure.Persistence.Configurations;

public class TaskLabelConfiguration : IEntityTypeConfiguration<TaskLabel>
{
    public void Configure(EntityTypeBuilder<TaskLabel> builder)
    {
        builder.HasKey(tl => new { tl.TaskId, tl.LabelId });
        builder.HasOne(tl => tl.Task).WithMany(t => t.TaskLabels).HasForeignKey(tl => tl.TaskId);
        builder.HasOne(tl => tl.Label).WithMany(l => l.TaskLabels).HasForeignKey(tl => tl.LabelId);
    }
}
