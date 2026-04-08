using WorkloadTracker.API.DTOs;

namespace WorkloadTracker.API.Services;

public interface ITaskService
{
    Task<List<TaskResponseDto>> GetTasksAsync(string userId, string role);
    Task<TaskResponseDto?> GetTaskByIdAsync(int id);
    Task<TaskResponseDto> CreateTaskAsync(TaskCreateDto dto);
    Task<TaskResponseDto?> UpdateTaskAsync(int id, TaskUpdateDto dto);
    Task<bool> DeleteTaskAsync(int id);
    Task<bool> AcknowledgeTaskAsync(int taskId, string userId);
}