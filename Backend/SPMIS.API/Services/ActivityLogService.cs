using SPMIS.API.Data;
using SPMIS.API.Models;
using System;

namespace SPMIS.API.Services
{
    public class ActivityLogService
    {
        private readonly AppDbContext _context;

        public ActivityLogService(AppDbContext context)
        {
            _context = context;
        }

        public void LogActivity(int projectId, string action, int? userId = null)
        {
            _context.ActivityLogs.Add(new ActivityLog
            {
                ProjectId = projectId,
                Action = action,
                Timestamp = DateTime.UtcNow,
                UserId = userId
            });
            _context.SaveChanges();
        }
    }
}
