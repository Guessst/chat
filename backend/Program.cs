using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;

var builder = WebApplication.CreateBuilder(args);

// Adicionar política CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000") // React
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // importante para SignalR
    });
});
builder.Services.AddSignalR();

// read RabbitMQ config from settings
var rabbitConfig = builder.Configuration.GetSection("RabbitMQ");
builder.Services.Configure<RabbitMqOptions>(rabbitConfig);

builder.Services.AddDbContext<ChatDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);

builder.Services.AddSingleton<MessagePublisher>();
builder.Services.AddSingleton<MessageConsumer>();
builder.Services.AddHostedService<MessageCleanupService>();
builder.Services.AddControllers();

var app = builder.Build();
app.UseCors();

// Migrate no Startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ChatDbContext>();
    db.Database.Migrate();
}

// Inicializa serviços async
var publisher = app.Services.GetRequiredService<MessagePublisher>();
await publisher.InitializeAsync();

var consumer = app.Services.GetRequiredService<MessageConsumer>();
await consumer.InitializeAsync();
consumer.OnMessageReceived += async msg =>
{
    var data = JsonSerializer.Deserialize<ChatMessage>(msg);
    if (data is null)
    {
        Console.WriteLine("Received null data.");
        return;    
    }

    var hubContext = app.Services.GetRequiredService<IHubContext<ChatHub>>();
    await hubContext.Clients.All.SendAsync("ReceiveMessage", data.User, data.TextContent, data.Timestamp);
};
await consumer.StartAsync();

app.MapControllers();
app.MapHub<ChatHub>("/chatHub");
app.Run();
