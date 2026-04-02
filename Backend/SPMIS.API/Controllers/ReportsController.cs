using Microsoft.AspNetCore.Mvc;
using SPMIS.API.Data;
using SPMIS.API.Models;
using System.Linq;

namespace SPMIS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("{projectId}")]
        public IActionResult GetReports(int projectId)
        {
            return Ok(_context.Reports.Where(r => r.ProjectId == projectId).ToList());
        }

        [HttpPost]
        public IActionResult SubmitReport([FromBody] WeeklyReport report)
        {
            _context.Reports.Add(report);
            _context.SaveChanges();
            return Ok(report);
        }

        [HttpPost("{id}/feedback")]
        public IActionResult AddFeedback(int id, [FromBody] string feedback)
        {
            var report = _context.Reports.Find(id);
            if (report == null) return NotFound();

            report.SupervisorFeedback = feedback;
            _context.SaveChanges();
            return Ok(report);
        }
    }
}
