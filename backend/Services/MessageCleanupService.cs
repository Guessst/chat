using Microsoft.EntityFrameworkCore;

public class MessageCleanupService : BackgroundService
{
    private readonly IServiceProvider _services;

    public MessageCleanupService(IServiceProvider services)
    {
        _services = services;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var brazilTz = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
        // On Linux/macOS this may be "America/Sao_Paulo"

        while (!stoppingToken.IsCancellationRequested)
        {
            var nowUtc = DateTime.UtcNow;

            // Convert current UTC to Brazil time
            var nowBrazil = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, brazilTz);

            // Next midnight in Brazil time
            var nextMidnightBrazil = nowBrazil.Date.AddDays(1);

            // Convert that midnight back to UTC for delay calculation
            var nextRunUtc = TimeZoneInfo.ConvertTimeToUtc(nextMidnightBrazil, brazilTz);

            var delay = nextRunUtc - nowUtc;

            await Task.Delay(delay, stoppingToken);

            using var scope = _services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ChatDbContext>();

            await db.Database.ExecuteSqlRawAsync("DELETE FROM \"Messages\";", stoppingToken);
        }
    }
    // 1 minuto, para testar
    // protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    // {
    //     while (!stoppingToken.IsCancellationRequested)
    //     {
    //         using var scope = _services.CreateScope();
    //         var db = scope.ServiceProvider.GetRequiredService<ChatDbContext>();

    //         // Delete all messages
    //         await db.Database.ExecuteSqlRawAsync("DELETE FROM \"Messages\";", stoppingToken);
    //         Console.WriteLine($"Messages cleared at {DateTime.Now}");

    //         // Wait 1 minute for testing
    //         var delay = TimeSpan.FromMinutes(1);
    //         await Task.Delay(delay, stoppingToken);
    //     }
    // }


}
