using System;
using System.ComponentModel.DataAnnotations;

namespace SPMIS.API.Models
{
    public class ProjectDocument
    {
        [Key]
        public int Id { get; set; }
        public int ProjectId { get; set; }
        [Required]
        public string FileName { get; set; }
        [Required]
        public string FilePath { get; set; }
        public int UploadedBy { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}
