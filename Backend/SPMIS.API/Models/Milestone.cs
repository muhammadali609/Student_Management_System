using System;
using System.ComponentModel.DataAnnotations;

namespace SPMIS.API.Models
{
    public class Milestone
    {
        [Key]
        public int Id { get; set; }
        public int ProjectId { get; set; }
        [Required]
        public string Title { get; set; }
        public DateTime DueDate { get; set; }
        public bool IsCompleted { get; set; }
    }
}
