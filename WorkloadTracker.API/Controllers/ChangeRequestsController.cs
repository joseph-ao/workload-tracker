using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkloadTracker.API.DTOs;
using WorkloadTracker.API.Services;

namespace WorkloadTracker.API.Controllers;

[ApiController]
[Route("api/change-requests")]
[Authorize]
public class ChangeRequestsController : ControllerBase
{
    private readonly IChangeRequestService _service;

    public ChangeRequestsController(IChangeRequestService service)
    {
        _service = service;
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
    public async Task<IActionResult> GetAll()
    {
        var requests = await _service.GetAllAsync();
        return Ok(requests);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ChangeRequestCreateDto dto)
    {
        var userId = GetUserId();
        var result = await _service.CreateAsync(dto, userId);
        return Ok(result);
    }

    [HttpPut("{id}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        if (GetUserRole() != "TeamLeader") return Forbid();
        var success = await _service.ApproveAsync(id);
        if (!success) return NotFound();
        return Ok("Change request approved.");
    }

    [HttpPut("{id}/reject")]
    public async Task<IActionResult> Reject(int id)
    {
        if (GetUserRole() != "TeamLeader") return Forbid();
        var success = await _service.RejectAsync(id);
        if (!success) return NotFound();
        return Ok("Change request rejected.");
    }
}