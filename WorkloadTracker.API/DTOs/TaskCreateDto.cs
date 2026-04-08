namespace WorkloadTracker.API.DTOs;

public class TaskCreateDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium";
    public string Complexity { get; set; } = "Medium";
    public double EffortHours { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime DueDate { get; set; }
    public string AssignedUserId { get; set; } = string.Empty;
}