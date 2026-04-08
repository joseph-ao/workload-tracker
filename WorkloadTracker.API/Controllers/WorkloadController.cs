using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkloadTracker.API.Services;

namespace WorkloadTracker.API.Controllers;

[ApiController]
[Route("api/workload")]
[Authorize]
public class WorkloadController : ControllerBase
{
    private readonly IWorkloadService _service;

    public WorkloadController(IWorkloadService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetTeamWorkload()
    {
        var workload = await _service.GetTeamWorkloadAsync();
        return Ok(workload);
    }
}