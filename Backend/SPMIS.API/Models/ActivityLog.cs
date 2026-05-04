using System;
using System.ComponentModel.DataAnnotations;

namespace SPMIS.API.Models
{
    public class ActivityLog
    {
        [Key]
        public int Id { get; set; }
        public int ProjectId { get; set; }
        [Required]
        public string Action { get; set; }
        public DateTime Timestamp { get; set; }
        public int? UserId { get; set; }
    }
}
