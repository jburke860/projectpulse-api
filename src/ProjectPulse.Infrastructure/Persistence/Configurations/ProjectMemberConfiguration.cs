using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProjectPulse.Domain.Entities;

namespace ProjectPulse.Infrastructure.Persistence.Configurations;

public class ProjectMemberConfiguration : IEntityTypeConfiguration<ProjectMember>
{
    public void Configure(EntityTypeBuilder<ProjectMember> builder)
    {
        builder.HasKey(m => m.Id);
        builder.HasIndex(m => new { m.ProjectId, m.UserId }).IsUnique();
        builder.HasOne(m => m.User).WithMany(u => u.Memberships).HasForeignKey(m => m.UserId);
    }
}
