namespace WorkloadTracker.API.DTOs;


public class WorkloadResponseDto
{
    public string UserId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public int TaskCount { get; set; }
    public double TotalWeight { get; set; }
}