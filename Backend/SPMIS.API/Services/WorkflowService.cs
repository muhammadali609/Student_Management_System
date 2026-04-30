using SPMIS.API.Data;
using SPMIS.API.Models;

namespace SPMIS.API.Services;

public class WorkflowService
{
    private readonly AppDbContext _context;

    public WorkflowService(AppDbContext context)
    {
        _context = context;
    }

    public (bool Allowed, string Error) CanCreateTask(Project project)
    {
        if (project.Status != ProjectStates.Approved && project.Status != ProjectStates.InProgress)
        {
            return (false, "Tasks can only be created after proposal approval.");
        }

        return (true, string.Empty);
    }

    public (bool Allowed, string Error) CanSubmitReport(Project project)
    {
        var hasAnyTask = _context.Tasks.Any(t => t.ProjectId == project.Id);
        if (!hasAnyTask)
        {
            return (false, "At least one task must exist before submitting weekly reports.");
        }

        if (project.Status != ProjectStates.InProgress && project.Status != ProjectStates.Approved)
        {
            return (false, "Reports can only be submitted when project is active.");
        }

        return (true, string.Empty);
    }

    public (bool Allowed, string Error) CanSubmitFinal(Project project)
    {
        var projectTasks = _context.Tasks.Where(t => t.ProjectId == project.Id).ToList();
        if (projectTasks.Count == 0)
        {
            return (false, "Final submission requires tasks to be created and completed first.");
        }

        var allDone = projectTasks.All(t => t.Status == "Done");
        if (!allDone)
        {
            return (false, "Final submission is allowed only after all tasks are completed.");
        }

        return (true, string.Empty);
    }
}
