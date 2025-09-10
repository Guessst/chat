var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<MessagePublisher>();
builder.Services.AddSingleton<MessageConsumer>();
builder.Services.AddControllers();

var app = builder.Build();

// Inicializa serviços async
var publisher = app.Services.GetRequiredService<MessagePublisher>();
await publisher.InitializeAsync();

var consumer = app.Services.GetRequiredService<MessageConsumer>();
await consumer.InitializeAsync();
consumer.OnMessageReceived += msg => Console.WriteLine("Received: " + msg);
await consumer.StartAsync();

app.MapControllers();
app.Run();
