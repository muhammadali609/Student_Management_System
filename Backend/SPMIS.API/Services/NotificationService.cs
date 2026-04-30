namespace SPMIS.API.Services;

public class NotificationService
{
    public void NotifyUser(int userId, string message)
    {
        Console.WriteLine($"[Notify User:{userId}] {message}");
    }

    public void NotifyRole(string role, string message)
    {
        Console.WriteLine($"[Notify Role:{role}] {message}");
    }
}
