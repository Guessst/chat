using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

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

builder.Services.AddDbContext<ChatDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);


builder.Services.AddSingleton<MessagePublisher>();
builder.Services.AddSingleton<MessageConsumer>();
builder.Services.AddControllers();

var app = builder.Build();
app.UseCors();

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
