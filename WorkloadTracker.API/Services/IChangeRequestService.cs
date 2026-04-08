using WorkloadTracker.API.DTOs;

namespace WorkloadTracker.API.Services;

public interface IChangeRequestService
{
    Task<List<ChangeRequestResponseDto>> GetAllAsync();
    Task<ChangeRequestResponseDto> CreateAsync(ChangeRequestCreateDto dto, string requestedByUserId);
    Task<bool> ApproveAsync(int id);
    Task<bool> RejectAsync(int id);
}