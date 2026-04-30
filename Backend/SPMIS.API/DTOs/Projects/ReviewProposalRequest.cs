namespace SPMIS.API.DTOs.Projects;

public class ReviewProposalRequest
{
    public bool Approve { get; set; }
    public string? Comment { get; set; }
}
