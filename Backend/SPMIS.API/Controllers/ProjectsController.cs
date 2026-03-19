using Microsoft.AspNetCore.Mvc;
using SPMIS.API.Data;
using SPMIS.API.Models;
using System.Linq;

namespace SPMIS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjectsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetProjects()
        {
            return Ok(_context.Projects.ToList());
        }

        [HttpPost("register")]
        public IActionResult RegisterProject([FromBody] Project project)
        {
            project.Status = "Pending";
            _context.Projects.Add(project);
            _context.SaveChanges();
            return Ok(project);
        }

        [HttpPost("{id}/assign-supervisor")]
        public IActionResult AssignSupervisor(int id, [FromBody] int supervisorId)
        {
            var project = _context.Projects.Find(id);
            if (project == null) return NotFound();

            project.SupervisorId = supervisorId;
            _context.SaveChanges();
            return Ok(project);
        }

        [HttpPost("{id}/status")]
        public IActionResult UpdateStatus(int id, [FromBody] string status)
        {
            var project = _context.Projects.Find(id);
            if (project == null) return NotFound();

            project.Status = status; // e.g. "Approved" or "Rejected"
            _context.SaveChanges();
            return Ok(project);
        }
    }
}
