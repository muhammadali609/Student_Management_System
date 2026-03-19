using System;
using System.ComponentModel.DataAnnotations;

namespace SPMIS.API.Models
{
    public class ProjectTask
    {
        [Key]
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Status { get; set; } // "To Do", "In Progress", "Done"
        public string AssignedTo { get; set; }
    }
}
