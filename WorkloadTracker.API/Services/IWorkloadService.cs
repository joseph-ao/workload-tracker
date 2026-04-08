using WorkloadTracker.API.DTOs;

namespace WorkloadTracker.API.Services;

public interface IWorkloadService
{
    Task<List<WorkloadResponseDto>> GetTeamWorkloadAsync();
}