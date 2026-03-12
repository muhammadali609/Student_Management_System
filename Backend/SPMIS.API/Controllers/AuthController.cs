using Microsoft.AspNetCore.Mvc;
using SPMIS.API.Data;
using SPMIS.API.Models;
using System.Linq;

namespace SPMIS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var user = _context.Users.FirstOrDefault(u => u.Email == request.Email && u.Password == request.Password);
            if (user == null)
                return Unauthorized(new { message = "Invalid email or password" });
                
            return Ok(new { 
                id = user.Id,
                name = user.FullName,
                email = user.Email,
                role = user.Role,
                token = "mock-jwt-token-12345" 
            });
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}
