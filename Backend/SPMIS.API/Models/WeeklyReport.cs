using System;
using System.ComponentModel.DataAnnotations;

namespace SPMIS.API.Models
{
    public class WeeklyReport
    {
        [Key]
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public int WeekNumber { get; set; }
        public string ProgressText { get; set; }
        public string SupervisorFeedback { get; set; }
    }
}
