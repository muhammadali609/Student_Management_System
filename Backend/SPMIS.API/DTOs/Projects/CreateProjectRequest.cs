namespace SPMIS.API.DTOs.Projects;

public class CreateProjectRequest
{
    public string Title { get; set; } = string.Empty;
    public string Abstract { get; set; } = string.Empty;
    public string StudentIds { get; set; } = string.Empty;
    public int? SupervisorId { get; set; }
}
