namespace WorkloadTracker.API.Models;

public class ChangeRequest
{
    public int Id { get; set; }

    public int TaskId { get; set; }
    public TeamTask? Task { get; set; } 

    public string RequestedBy { get; set; } = string.Empty;

    public string ChangeType { get; set; } = string.Empty;

    public string OldValue { get; set; } = string.Empty;

    public string NewValue { get; set; } = string.Empty;

    public string Status { get; set; } = "Pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}