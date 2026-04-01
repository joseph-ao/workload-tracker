using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using WorkloadTracker.API.Models;

namespace WorkloadTracker.API.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<TeamTask> Tasks { get; set; }
    public DbSet<ChangeRequest> ChangeRequests { get; set; }
    public DbSet<TaskAcknowledgement> TaskAcknowledgements { get; set; }
    public DbSet<TaskStatusHistory> TaskStatusHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

     
        builder.Entity<TaskAcknowledgement>()
            .HasOne(a => a.Task)
            .WithMany()
            .HasForeignKey(a => a.TaskId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<TaskAcknowledgement>()
            .HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<TaskStatusHistory>()
            .HasOne(h => h.Task)
            .WithMany()
            .HasForeignKey(h => h.TaskId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}