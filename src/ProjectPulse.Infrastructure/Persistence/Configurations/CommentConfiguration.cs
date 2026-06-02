using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProjectPulse.Domain.Entities;

namespace ProjectPulse.Infrastructure.Persistence.Configurations;

public class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Body).HasMaxLength(4000).IsRequired();
        builder.HasOne(c => c.Author).WithMany().HasForeignKey(c => c.AuthorId);
    }
}
