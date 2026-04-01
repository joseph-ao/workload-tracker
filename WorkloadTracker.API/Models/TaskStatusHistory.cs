namespace WorkloadTracker.API.Models;

public class TaskStatusHistory
{
    public int Id { get; set; }

    public int TaskId { get; set; }
    public TeamTask? Task { get; set; }

    public string OldStatus { get; set; } = string.Empty;
    public string NewStatus { get; set; } = string.Empty;

    public string ChangedBy { get; set; } = string.Empty;

    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}