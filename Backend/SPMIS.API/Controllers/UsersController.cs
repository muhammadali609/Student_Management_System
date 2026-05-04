using Microsoft.AspNetCore.Mvc;
using SPMIS.API.Data;
using System.Linq;

namespace SPMIS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetUsers()
        {
            var users = _context.Users.Select(u => new { u.Id, u.FullName, u.Email, u.Role }).ToList();
            return Ok(users);
        }

        [HttpPut("{id}/role")]
        public IActionResult UpdateRole(int id, [FromBody] string role)
        {
            var user = _context.Users.Find(id);
            if (user == null) return NotFound(new { message = "User not found." });

            var allowedRoles = new[] { "Student", "Supervisor", "Admin" };
            if (!allowedRoles.Contains(role)) return BadRequest(new { message = "Invalid role." });

            user.Role = role;
            _context.SaveChanges();
            return Ok(new { user.Id, user.Role });
        }
    }
}
