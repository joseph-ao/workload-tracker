using Microsoft.EntityFrameworkCore;
using WorkloadTracker.API.Data;
using WorkloadTracker.API.DTOs;
using WorkloadTracker.API.Models;

namespace WorkloadTracker.API.Services;

public class TaskService : ITaskService
{
    private readonly AppDbContext _context;

    public TaskService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<TaskResponseDto>> GetTasksAsync(string userId, string role)
    {
        var query = _context.Tasks
            .Include(t => t.AssignedUser)
            .AsQueryable();

        if (role == "Member")
            query = query.Where(t => t.AssignedUserId == userId);

        var tasks = await query.ToListAsync();
        return tasks.Select(MapToDto).ToList();
    }

    public async Task<TaskResponseDto?> GetTaskByIdAsync(int id)
    {
        var task = await _context.Tasks
            .Include(t => t.AssignedUser)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task == null) return null;
        return MapToDto(task);
    }

    public async Task<TaskResponseDto> CreateTaskAsync(TaskCreateDto dto)
    {
        var task = new TeamTask
        {
            Title = dto.Title,
            Description = dto.Description,
            Priority = dto.Priority,
            Complexity = dto.Complexity,
            EffortHours = dto.EffortHours,
            StartDate = dto.StartDate,
            DueDate = dto.DueDate,
            AssignedUserId = dto.AssignedUserId,
            Status = "Pending"
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        await _context.Entry(task).Reference(t => t.AssignedUser).LoadAsync();
        return MapToDto(task);
    }

    public async Task<TaskResponseDto?> UpdateTaskAsync(int id, TaskUpdateDto dto)
    {
        var task = await _context.Tasks
            .Include(t => t.AssignedUser)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task == null) return null;

        var oldStatus = task.Status;

        task.Title = dto.Title;
        task.Description = dto.Description;
        task.Priority = dto.Priority;
        task.Complexity = dto.Complexity;
        task.EffortHours = dto.EffortHours;
        task.StartDate = dto.StartDate;
        task.DueDate = dto.DueDate;
        task.Status = dto.Status;
        task.AssignedUserId = dto.AssignedUserId;

        if (oldStatus != dto.Status)
        {
            _context.TaskStatusHistories.Add(new TaskStatusHistory
            {
                TaskId = task.Id,
                OldStatus = oldStatus,
                NewStatus = dto.Status,
                ChangedBy = dto.AssignedUserId,
                ChangedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return MapToDto(task);
    }

    public async Task<bool> DeleteTaskAsync(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return false;

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AcknowledgeTaskAsync(int taskId, string userId)
    {
        var task = await _context.Tasks.FindAsync(taskId);
        if (task == null) return false;

        var alreadyAcknowledged = await _context.TaskAcknowledgements
            .AnyAsync(a => a.TaskId == taskId && a.UserId == userId);

        if (alreadyAcknowledged) return true;

        _context.TaskAcknowledgements.Add(new TaskAcknowledgement
        {
            TaskId = taskId,
            UserId = userId,
            AcknowledgedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }

    private TaskResponseDto MapToDto(TeamTask task) => new TaskResponseDto
    {
        Id = task.Id,
        Title = task.Title,
        Description = task.Description,
        Priority = task.Priority,
        Complexity = task.Complexity,
        EffortHours = task.EffortHours,
        StartDate = task.StartDate,
        DueDate = task.DueDate,
        Status = task.Status,
        AssignedUserId = task.AssignedUserId,
        AssignedUserName = task.AssignedUser?.FullName ?? "Unknown",
        Weight = task.Weight
    };
}