using Microsoft.AspNetCore.Mvc;
using SPMIS.API.Data;
using SPMIS.API.DTOs.Tasks;
using SPMIS.API.Models;
using SPMIS.API.Services;
using System.Linq;

namespace SPMIS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly WorkflowService _workflow;
        private readonly NotificationService _notifications;

        public TasksController(AppDbContext context, WorkflowService workflow, NotificationService notifications)
        {
            _context = context;
            _workflow = workflow;
            _notifications = notifications;
        }

        [HttpGet("{projectId}")]
        public IActionResult GetTasks(int projectId)
        {
            return Ok(_context.Tasks.Where(t => t.ProjectId == projectId).ToList());
        }

        [HttpPost]
        public IActionResult CreateTask([FromBody] CreateTaskRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(new { message = "Task title is required." });
            }

            var project = _context.Projects.Find(request.ProjectId);
            if (project == null) return NotFound(new { message = "Project not found." });

            var check = _workflow.CanCreateTask(project);
            if (!check.Allowed)
            {
                return BadRequest(new { message = check.Error });
            }

            var task = new ProjectTask
            {
                ProjectId = request.ProjectId,
                Title = request.Title.Trim(),
                Description = request.Description ?? string.Empty,
                AssignedTo = request.AssignedTo ?? string.Empty,
                Status = "To Do"
            };
            _context.Tasks.Add(task);
            if (project.Status == ProjectStates.Approved)
            {
                project.Status = ProjectStates.InProgress;
            }
            _notifications.NotifyRole("Student", $"New task assigned in project: {project.Title}");
            _context.SaveChanges();
            return Created($"/api/tasks/{task.Id}", task);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateTaskStatus(int id, [FromBody] UpdateTaskStatusRequest request)
        {
            var task = _context.Tasks.Find(id);
            if (task == null) return NotFound(new { message = "Task not found." });

            var allowed = new[] { "To Do", "In Progress", "Done" };
            if (!allowed.Contains(request.Status))
            {
                return BadRequest(new { message = "Invalid task status." });
            }

            task.Status = request.Status;
            if (request.Status == "Done")
            {
                _notifications.NotifyRole("Supervisor", $"Task completed: {task.Title}");
            }
            _context.SaveChanges();
            return Ok(task);
        }
    }
}
