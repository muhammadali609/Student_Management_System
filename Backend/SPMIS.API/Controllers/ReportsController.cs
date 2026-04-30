using Microsoft.AspNetCore.Mvc;
using SPMIS.API.Data;
using SPMIS.API.DTOs.Reports;
using SPMIS.API.Models;
using SPMIS.API.Services;
using System.Linq;

namespace SPMIS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly WorkflowService _workflow;
        private readonly NotificationService _notifications;

        public ReportsController(AppDbContext context, WorkflowService workflow, NotificationService notifications)
        {
            _context = context;
            _workflow = workflow;
            _notifications = notifications;
        }

        [HttpGet("{projectId}")]
        public IActionResult GetReports(int projectId)
        {
            return Ok(_context.Reports.Where(r => r.ProjectId == projectId).ToList());
        }

        [HttpPost]
        public IActionResult SubmitReport([FromBody] SubmitReportRequest request)
        {
            if (request.WeekNumber <= 0 || string.IsNullOrWhiteSpace(request.ProgressText))
            {
                return BadRequest(new { message = "Week number and progress text are required." });
            }

            var project = _context.Projects.Find(request.ProjectId);
            if (project == null) return NotFound(new { message = "Project not found." });

            var check = _workflow.CanSubmitReport(project);
            if (!check.Allowed)
            {
                return BadRequest(new { message = check.Error });
            }

            var report = new WeeklyReport
            {
                ProjectId = request.ProjectId,
                WeekNumber = request.WeekNumber,
                ProgressText = request.ProgressText.Trim(),
                SupervisorFeedback = string.Empty
            };
            _context.Reports.Add(report);
            _notifications.NotifyRole("Supervisor", $"Weekly report submitted for project: {project.Title}");
            _context.SaveChanges();
            return Created($"/api/reports/{report.Id}", report);
        }

        [HttpPost("{id}/feedback")]
        public IActionResult AddFeedback(int id, [FromBody] AddFeedbackRequest request)
        {
            var report = _context.Reports.Find(id);
            if (report == null) return NotFound(new { message = "Report not found." });

            if (string.IsNullOrWhiteSpace(request.Feedback))
            {
                return BadRequest(new { message = "Feedback text is required." });
            }

            report.SupervisorFeedback = request.Feedback.Trim();
            _notifications.NotifyRole("Student", $"New supervisor feedback added for week {report.WeekNumber}.");
            _context.SaveChanges();
            return Ok(report);
        }
    }
}
