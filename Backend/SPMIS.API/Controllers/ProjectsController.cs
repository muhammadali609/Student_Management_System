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
        private readonly ActivityLogService _logs;

        public ProjectsController(AppDbContext context, WorkflowService workflow, NotificationService notifications, ActivityLogService logs)
        {
            _context = context;
            _workflow = workflow;
            _notifications = notifications;
            _logs = logs;
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
            _logs.LogActivity(project.Id, "Project created/registered.");

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
            _logs.LogActivity(project.Id, "Proposal submitted.");

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
            _logs.LogActivity(project.Id, $"Proposal {(request.Approve ? "approved" : "rejected")}.");

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
            _logs.LogActivity(project.Id, "Final submission uploaded.");

            return Ok(project);
        }

        [HttpPost("{id}/complete")]
        public IActionResult MarkCompleted(int id, [FromBody] EvaluationRequest request)
        {
            var project = _context.Projects.Find(id);
            if (project == null) return NotFound(new { message = "Project not found." });

            if (project.Status != ProjectStates.UnderReview)
            {
                return BadRequest(new { message = "Project must be under review before completion." });
            }

            project.Status = ProjectStates.Completed;
            project.EvaluationScore = request.Score;
            project.EvaluationComments = request.Comments;
            _notifications.NotifyRole("Admin", $"Project completed and ready for archive: {project.Title}");
            _context.SaveChanges();
            _logs.LogActivity(project.Id, $"Project completed with score: {request.Score}.");
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
            _logs.LogActivity(project.Id, "Project archived.");
            return Ok(project);
        }

        [HttpPost("{id}/assign-supervisor")]
        public IActionResult AssignSupervisor(int id, [FromBody] int supervisorId)
        {
            var project = _context.Projects.Find(id);
            if (project == null) return NotFound(new { message = "Project not found." });

            project.SupervisorId = supervisorId;
            _context.SaveChanges();
            _logs.LogActivity(project.Id, $"Supervisor ID {supervisorId} assigned.");
            return Ok(project);
        }

        [HttpGet("{id}/report")]
        public IActionResult GenerateReport(int id)
        {
            var project = _context.Projects.Find(id);
            if (project == null) return NotFound(new { message = "Project not found." });

            var tasks = _context.Tasks.Where(t => t.ProjectId == id).ToList();
            var reports = _context.Reports.Where(r => r.ProjectId == id).ToList();
            var milestones = _context.Milestones.Where(m => m.ProjectId == id).ToList();

            var summary = new
            {
                Project = project,
                TasksTotal = tasks.Count,
                TasksCompleted = tasks.Count(t => t.Status == "Done"),
                WeeklyReports = reports,
                Milestones = milestones,
                GeneratedAt = DateTime.UtcNow
            };

            _logs.LogActivity(project.Id, "Report generated.");
            return Ok(summary);
        }

        [HttpGet("analytics")]
        public IActionResult GetAnalytics()
        {
            var projects = _context.Projects.ToList();
            var tasks = _context.Tasks.ToList();

            var stats = new
            {
                TotalProjects = projects.Count,
                ActiveProjects = projects.Count(p => p.Status == ProjectStates.InProgress || p.Status == ProjectStates.Approved),
                CompletedProjects = projects.Count(p => p.Status == ProjectStates.Completed),
                TotalTasks = tasks.Count,
                CompletedTasks = tasks.Count(t => t.Status == "Done")
            };

            return Ok(stats);
        }
    }
}
