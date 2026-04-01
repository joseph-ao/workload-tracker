namespace WorkloadTracker.API.Models;

public class TeamTask
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium"; // Low, Medium, High
    public string Complexity { get; set; } = "Medium"; // Low, Medium, High
    public double EffortHours { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, InProgress, Done
    public string AssignedUserId { get; set; } = string.Empty;
    public AppUser? AssignedUser { get; set; }
    
    public double Weight =>
        (Priority == "High" ? 3 : Priority == "Medium" ? 2 : 1) *
        (Complexity == "High" ? 3 : Complexity == "Medium" ? 2 : 1) *
        EffortHours;
}