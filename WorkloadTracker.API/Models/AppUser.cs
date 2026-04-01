using Microsoft.AspNetCore.Identity;

namespace WorkloadTracker.API.Models;

public class AppUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = "Member"; // "TeamLeader" or "Member"
    public string? TeamId { get; set; }
}