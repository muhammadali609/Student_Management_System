using Microsoft.AspNetCore.Mvc;
using SPMIS.API.Data;
using SPMIS.API.Models;
using System.Linq;

namespace SPMIS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TasksController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("{projectId}")]
        public IActionResult GetTasks(int projectId)
        {
            return Ok(_context.Tasks.Where(t => t.ProjectId == projectId).ToList());
        }

        [HttpPost]
        public IActionResult CreateTask([FromBody] ProjectTask task)
        {
            _context.Tasks.Add(task);
            _context.SaveChanges();
            return Ok(task);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateTaskStatus(int id, [FromBody] string status)
        {
            var task = _context.Tasks.Find(id);
            if (task == null) return NotFound();

            task.Status = status;
            _context.SaveChanges();
            return Ok(task);
        }
    }
}
