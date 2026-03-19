using Microsoft.EntityFrameworkCore;
using SPMIS.API.Models;

namespace SPMIS.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectTask> Tasks { get; set; }
        public DbSet<WeeklyReport> Reports { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Seed a default admin and supervisor for testing
            modelBuilder.Entity<User>().HasData(
                new User { Id = 1, FullName = "Admin Default", Email = "admin@spmis.edu", Password = "admin", Role = "Admin" },
                new User { Id = 2, FullName = "Dr. Supervisor", Email = "supervisor@spmis.edu", Password = "password", Role = "Supervisor" },
                new User { Id = 3, FullName = "Student Default", Email = "student@spmis.edu", Password = "password", Role = "Student" }
            );
        }
    }
}
