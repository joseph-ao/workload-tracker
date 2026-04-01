namespace WorkloadTracker.API.Models;


public class TaskAcknowledgement
{
    public int Id { get; set; }

    public int TaskId { get; set; }
    public TeamTask? Task { get; set; }
    public string UserId { get; set; } = string.Empty;
    public AppUser? User { get; set; }
    public DateTime AcknowledgedAt { get; set; } = DateTime.UtcNow;
}