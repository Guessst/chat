using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Adicionar política CORS
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()
    ?? throw new InvalidOperationException("CORS origins not configured.");

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddSignalR();

{ // Load env when not running on Docker
    var environmentName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
    if (!string.IsNullOrEmpty(environmentName) && environmentName == "Development")
    {
        DotNetEnv.Env.Load(path: "../.env.development");
    }
}
{ // Init RabbitMQ config from env variables
    var rabbitmqHostName = Environment.GetEnvironmentVariable("ENV_RABBIT_MQ_HOSTNAME");
    var rabbitmqUserName = Environment.GetEnvironmentVariable("ENV_RABBIT_MQ_USER");
    var rabbitmqPassword = Environment.GetEnvironmentVariable("ENV_RABBIT_MQ_PASS");
    if (string.IsNullOrEmpty(rabbitmqHostName)
        || string.IsNullOrEmpty(rabbitmqUserName)
        || string.IsNullOrEmpty(rabbitmqPassword)
    ) {
        throw new InvalidOperationException("Found empty ENV_ variable in rabbitmq variables.");
    }

    builder.Services.Configure<RabbitMqOptions>(options => {
        options.HostName = rabbitmqHostName;
        options.UserName = rabbitmqUserName;
        options.Password = rabbitmqPassword;
    });
}
{ // Connecting to DB with env variables
    var postgresHost     = Environment.GetEnvironmentVariable("ENV_POSTGRES_HOST");
    var postgresDb       = Environment.GetEnvironmentVariable("ENV_POSTGRES_DB");
    var postgresUser     = Environment.GetEnvironmentVariable("ENV_POSTGRES_USER");
    var postgresPassword = Environment.GetEnvironmentVariable("ENV_POSTGRES_PASSWORD");
    if (string.IsNullOrEmpty(postgresHost)
        || string.IsNullOrEmpty(postgresDb)
        || string.IsNullOrEmpty(postgresUser)
        || string.IsNullOrEmpty(postgresPassword)
    ) {
        throw new InvalidOperationException("Found empty ENV_ variable in postgres variables.");
    }

    string connectionString = $"Host={postgresHost};Port=5432;Database={postgresDb};Username={postgresUser};Password={postgresPassword}";

    builder.Services.AddDbContext<ChatDbContext>(options =>
        options.UseNpgsql(connectionString)
    );
}

builder.Services.AddSingleton<MessagePublisher>();
builder.Services.AddSingleton<MessageConsumer>();
builder.Services.AddHostedService<MessageCleanupService>();
builder.Services.AddControllers();

builder.Logging.ClearProviders();
builder.Logging.AddSimpleConsole(options =>
{
    options.IncludeScopes = true;
    options.SingleLine = true;
    options.TimestampFormat = "[dd-MM-yyyy HH:mm:ss.fff] ";
});

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
    await hubContext.Clients.All.SendAsync("ReceiveMessage", data.Id, data.Username, data.TextContent, data.Timestamp);
};
await consumer.StartAsync();

app.MapControllers();
app.MapHub<ChatHub>("/chatHub");
app.Run();
