using Microsoft.AspNetCore.Mvc;
using SPMIS.API.Data;
using System.Linq;

namespace SPMIS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LogsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("{projectId}")]
        public IActionResult GetLogs(int projectId)
        {
            return Ok(_context.ActivityLogs.Where(l => l.ProjectId == projectId).OrderByDescending(l => l.Timestamp).ToList());
        }
    }
}
