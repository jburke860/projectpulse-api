using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProjectPulse.Domain.Entities;

namespace ProjectPulse.Infrastructure.Persistence.Configurations;

public class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Name).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Description).HasMaxLength(2000);
        builder.Property(p => p.Icon).HasMaxLength(40);
        builder.Property(p => p.Color).HasMaxLength(16);
        builder.HasMany(p => p.Members).WithOne(m => m.Project).HasForeignKey(m => m.ProjectId);
        builder.HasMany(p => p.Tasks).WithOne(t => t.Project).HasForeignKey(t => t.ProjectId);
        builder.HasMany(p => p.Labels).WithOne(l => l.Project).HasForeignKey(l => l.ProjectId);
        builder.HasMany(p => p.AuditLogs).WithOne(a => a.Project).HasForeignKey(a => a.ProjectId);
    }
}
