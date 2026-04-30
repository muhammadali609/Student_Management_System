namespace SPMIS.API.DTOs.Reports;

public class SubmitReportRequest
{
    public int ProjectId { get; set; }
    public int WeekNumber { get; set; }
    public string ProgressText { get; set; } = string.Empty;
}
