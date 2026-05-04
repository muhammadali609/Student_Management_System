using Microsoft.AspNetCore.Mvc;
using SPMIS.API.Data;
using SPMIS.API.Models;
using System;
using System.Linq;

namespace SPMIS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DocumentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("{projectId}")]
        public IActionResult GetDocuments(int projectId)
        {
            return Ok(_context.ProjectDocuments.Where(d => d.ProjectId == projectId).ToList());
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument([FromForm] int projectId, [FromForm] int uploadedBy, IFormFile file)
        {
            var project = _context.Projects.Find(projectId);
            if (project == null) return NotFound(new { message = "Project not found." });

            if (file == null || file.Length == 0) return BadRequest(new { message = "No file uploaded." });

            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);

            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var document = new ProjectDocument
            {
                ProjectId = projectId,
                FileName = file.FileName,
                FilePath = $"/uploads/{fileName}",
                UploadedBy = uploadedBy,
                UploadedAt = DateTime.UtcNow
            };

            _context.ProjectDocuments.Add(document);
            _context.SaveChanges();
            return Created($"/api/documents/{document.Id}", document);
        }
    }
}
