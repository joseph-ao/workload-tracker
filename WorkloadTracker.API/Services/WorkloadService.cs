using Microsoft.EntityFrameworkCore;
using WorkloadTracker.API.Data;
using WorkloadTracker.API.DTOs;

namespace WorkloadTracker.API.Services;

public class WorkloadService : IWorkloadService
{
    private readonly AppDbContext _context;

    public WorkloadService(AppDbContext context)
    {
        _context = context;
    }


    public async Task<List<WorkloadResponseDto>> GetTeamWorkloadAsync()
    {
        var tasks = await _context.Tasks
            .Include(t => t.AssignedUser)
            .Where(t => t.Status != "Done") 
            .ToListAsync();

     
        var workload = tasks
            .GroupBy(t => t.AssignedUser)
            .Select(group => new WorkloadResponseDto
            {
                UserId = group.Key?.Id ?? string.Empty,
                FullName = group.Key?.FullName ?? "Unknown",
                TaskCount = group.Count(),
                TotalWeight = group.Sum(t => t.Weight)
            })
            .OrderByDescending(w => w.TotalWeight) 
            .ToList();

        return workload;
    }
}