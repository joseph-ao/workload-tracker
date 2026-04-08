namespace WorkloadTracker.API.DTOs;

public class ChangeRequestCreateDto
{
    public int TaskId { get; set; }
    public string ChangeType { get; set; } = string.Empty;
    public string OldValue { get; set; } = string.Empty;
    public string NewValue { get; set; } = string.Empty;
}