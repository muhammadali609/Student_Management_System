using System;
using System.ComponentModel.DataAnnotations;

namespace SPMIS.API.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string FullName { get; set; }
        
        [Required]
        public string Email { get; set; }
        
        [Required]
        public string Password { get; set; } // Plaintext for simplicity given the scope
        
        [Required]
        public string Role { get; set; } // "Student", "Supervisor", "Admin"
    }
}
