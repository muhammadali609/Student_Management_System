using Microsoft.AspNetCore.Mvc;
using SPMIS.API.Data;
using SPMIS.API.Models;
using System.Linq;

namespace SPMIS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MilestonesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MilestonesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("{projectId}")]
        public IActionResult GetMilestones(int projectId)
        {
            return Ok(_context.Milestones.Where(m => m.ProjectId == projectId).ToList());
        }

        [HttpPost]
        public IActionResult CreateMilestone([FromBody] Milestone milestone)
        {
            var project = _context.Projects.Find(milestone.ProjectId);
            if (project == null) return NotFound(new { message = "Project not found." });

            _context.Milestones.Add(milestone);
            _context.SaveChanges();
            return Created($"/api/milestones/{milestone.Id}", milestone);
        }

        [HttpPut("{id}/complete")]
        public IActionResult CompleteMilestone(int id)
        {
            var milestone = _context.Milestones.Find(id);
            if (milestone == null) return NotFound();

            milestone.IsCompleted = true;
            _context.SaveChanges();
            return Ok(milestone);
        }
    }
}
