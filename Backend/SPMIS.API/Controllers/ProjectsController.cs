using Microsoft.AspNetCore.Mvc;
using SPMIS.API.DTOs.Projects;
using SPMIS.API.Data;
using SPMIS.API.Models;
using SPMIS.API.Services;
using System.Linq;

namespace SPMIS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly WorkflowService _workflow;
        private readonly NotificationService _notifications;

        public ProjectsController(AppDbContext context, WorkflowService workflow, NotificationService notifications)
        {
            _context = context;
            _workflow = workflow;
            _notifications = notifications;
        }

        [HttpGet]
        public IActionResult GetProjects([FromQuery] int? userId = null, [FromQuery] string? role = null)
        {
            var query = _context.Projects.AsQueryable();
            if (userId.HasValue && !string.IsNullOrWhiteSpace(role))
            {
                if (role == "Student")
                {
                    query = query.Where(p => p.StudentIds != null && p.StudentIds.Contains(userId.Value.ToString()));
                }
                else if (role == "Supervisor")
                {
                    query = query.Where(p => p.SupervisorId == userId.Value);
                }
            }
            return Ok(query.ToList());
        }

        [HttpPost("register")]
        public IActionResult RegisterProject([FromBody] CreateProjectRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Abstract))
            {
                return BadRequest(new { message = "Title and abstract are required." });
            }

            var project = new Project
            {
                Title = request.Title.Trim(),
                Abstract = request.Abstract.Trim(),
                StudentIds = request.StudentIds ?? string.Empty,
                SupervisorId = request.SupervisorId,
                Status = ProjectStates.Draft
            };
            _context.Projects.Add(project);
            _context.SaveChanges();
            return Created($"/api/projects/{project.Id}", project);
        }

        [HttpPost("{id}/submit-proposal")]
        public IActionResult SubmitProposal(int id)
        {
            var project = _context.Projects.Find(id);
            if (project == null) return NotFound(new { message = "Project not found." });

            if (project.Status != ProjectStates.Draft && project.Status != ProjectStates.Rejected)
            {
                return BadRequest(new { message = "Proposal can only be submitted from Draft or Rejected state." });
            }

            if (string.IsNullOrWhiteSpace(project.StudentIds))
            {
                return BadRequest(new { message = "Group members are required before proposal submission." });
            }

            project.Status = ProjectStates.ProposalSubmitted;
            _notifications.NotifyRole("Supervisor", $"New proposal submitted: {project.Title}");
            _context.SaveChanges();
            return Ok(project);
        }

        [HttpPost("{id}/review-proposal")]
        public IActionResult ReviewProposal(int id, [FromBody] ReviewProposalRequest request)
        {
            var project = _context.Projects.Find(id);
            if (project == null) return NotFound(new { message = "Project not found." });

            if (project.Status != ProjectStates.ProposalSubmitted)
            {
                return BadRequest(new { message = "Only submitted proposals can be reviewed." });
            }

            project.Status = request.Approve ? ProjectStates.Approved : ProjectStates.Rejected;
            _notifications.NotifyRole("Student", request.Approve
                ? $"Proposal approved: {project.Title}. Tasks are now available."
                : $"Proposal rejected: {project.Title}. Please revise and resubmit.");
            _context.SaveChanges();
            return Ok(project);
        }

        [HttpPost("{id}/final-submit")]
        public IActionResult FinalSubmit(int id)
        {
            var project = _context.Projects.Find(id);
            if (project == null) return NotFound(new { message = "Project not found." });

            var check = _workflow.CanSubmitFinal(project);
            if (!check.Allowed)
            {
                return BadRequest(new { message = check.Error });
            }

            project.Status = ProjectStates.UnderReview;
            _notifications.NotifyRole("Supervisor", $"Final submission uploaded: {project.Title}");
            _context.SaveChanges();
            return Ok(project);
        }

        [HttpPost("{id}/complete")]
        public IActionResult MarkCompleted(int id)
        {
            var project = _context.Projects.Find(id);
            if (project == null) return NotFound(new { message = "Project not found." });

            if (project.Status != ProjectStates.UnderReview)
            {
                return BadRequest(new { message = "Project must be under review before completion." });
            }

            project.Status = ProjectStates.Completed;
            _notifications.NotifyRole("Admin", $"Project completed and ready for archive: {project.Title}");
            _context.SaveChanges();
            return Ok(project);
        }

        [HttpPost("{id}/archive")]
        public IActionResult ArchiveProject(int id)
        {
            var project = _context.Projects.Find(id);
            if (project == null) return NotFound(new { message = "Project not found." });

            if (project.Status != ProjectStates.Completed)
            {
                return BadRequest(new { message = "Only completed projects can be archived." });
            }

            project.Status = ProjectStates.Archived;
            _context.SaveChanges();
            return Ok(project);
        }
    }
}
