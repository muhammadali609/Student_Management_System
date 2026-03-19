using System;
using System.ComponentModel.DataAnnotations;

namespace SPMIS.API.Models
{
    public class Project
    {
        [Key]
        public int Id { get; set; }
        public string Title { get; set; }
        public string Abstract { get; set; }
        public string StudentIds { get; set; } // Comma separated for simplicity
        public int? SupervisorId { get; set; }
        public string Status { get; set; } // "Pending", "Approved", "Rejected", "Completed"
    }
}
