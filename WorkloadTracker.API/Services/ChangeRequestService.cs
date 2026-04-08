using Microsoft.EntityFrameworkCore;
using WorkloadTracker.API.Data;
using WorkloadTracker.API.DTOs;
using WorkloadTracker.API.Models;

namespace WorkloadTracker.API.Services;

public class ChangeRequestService : IChangeRequestService
{
    private readonly AppDbContext _context;

    public ChangeRequestService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ChangeRequestResponseDto>> GetAllAsync()
    {
        var requests = await _context.ChangeRequests
            .Include(r => r.Task)
            .ToListAsync();

        return requests.Select(MapToDto).ToList();
    }

  
    public async Task<ChangeRequestResponseDto> CreateAsync(ChangeRequestCreateDto dto, string requestedByUserId)
    {
        var request = new ChangeRequest
        {
            TaskId = dto.TaskId,
            RequestedBy = requestedByUserId,
            ChangeType = dto.ChangeType,
            OldValue = dto.OldValue,
            NewValue = dto.NewValue,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.ChangeRequests.Add(request);
        await _context.SaveChangesAsync();

        await _context.Entry(request).Reference(r => r.Task).LoadAsync();
        return MapToDto(request);
    }

   
    public async Task<bool> ApproveAsync(int id)
    {
        var request = await _context.ChangeRequests
            .Include(r => r.Task)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null) return false;

        request.Status = "Approved";

        if (request.ChangeType == "StatusChange" && request.Task != null)
        {
            var oldStatus = request.Task.Status;
            request.Task.Status = request.NewValue;

            _context.TaskStatusHistories.Add(new TaskStatusHistory
            {
                TaskId = request.TaskId,
                OldStatus = oldStatus,
                NewStatus = request.NewValue,
                ChangedBy = request.RequestedBy,
                ChangedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RejectAsync(int id)
    {
        var request = await _context.ChangeRequests.FindAsync(id);
        if (request == null) return false;

        request.Status = "Rejected";
        await _context.SaveChangesAsync();
        return true;
    }

    private ChangeRequestResponseDto MapToDto(ChangeRequest r) => new ChangeRequestResponseDto
    {
        Id = r.Id,
        TaskId = r.TaskId,
        TaskTitle = r.Task?.Title ?? "Unknown",
        RequestedBy = r.RequestedBy,
        ChangeType = r.ChangeType,
        OldValue = r.OldValue,
        NewValue = r.NewValue,
        Status = r.Status,
        CreatedAt = r.CreatedAt
    };
}