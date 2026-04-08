using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkloadTracker.API.DTOs;
using WorkloadTracker.API.Services;

namespace WorkloadTracker.API.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize] 
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

   
    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? string.Empty;

   private string GetUserRole() =>
    User.FindFirstValue("role")
    ?? User.FindFirstValue(ClaimTypes.Role)
    ?? User.Claims.FirstOrDefault(c => c.Type.EndsWith("role"))?.Value
    ?? string.Empty;
   
    [HttpGet]
    public async Task<IActionResult> GetTasks()
    {
        var userId = GetUserId();
        var role = GetUserRole();
        var tasks = await _taskService.GetTasksAsync(userId, role);
        return Ok(tasks);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTask(int id)
    {
        var task = await _taskService.GetTaskByIdAsync(id);
        if (task == null) return NotFound();
        return Ok(task);
    }

  
    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] TaskCreateDto dto)
    {
        var role = GetUserRole();
        if (role != "TeamLeader")
            return Forbid(); 

        var task = await _taskService.CreateTaskAsync(dto);
        return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskUpdateDto dto)
    {
        var task = await _taskService.UpdateTaskAsync(id, dto);
        if (task == null) return NotFound();
        return Ok(task);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        var role = GetUserRole();
        if (role != "TeamLeader")
            return Forbid();

        var success = await _taskService.DeleteTaskAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPost("{id}/acknowledge")]
    public async Task<IActionResult> AcknowledgeTask(int id)
    {
        var userId = GetUserId();
        var success = await _taskService.AcknowledgeTaskAsync(id, userId);
        if (!success) return NotFound();
        return Ok("Task acknowledged.");
    }
}
