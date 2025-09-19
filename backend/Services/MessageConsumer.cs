using System.Text;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

public class MessageConsumer : IAsyncDisposable
{
    
    private IConnection? _connection;
    private IChannel? _channel;
    private readonly RabbitMqOptions _options;
    public MessageConsumer(IOptions<RabbitMqOptions> options)
    {
        _options = options.Value;
    }
    public event Action<string>? OnMessageReceived;
    
    public async Task InitializeAsync()
    {
        var factory = new ConnectionFactory();
        factory.UserName = _options.UserName;
        factory.Password = _options.Password;
        factory.HostName = _options.HostName;
        
        _connection = await factory.CreateConnectionAsync();
        _channel = await _connection.CreateChannelAsync();

        await _channel.QueueDeclareAsync(
            queue: "chat",
            durable: false,
            exclusive: false,
            autoDelete: false,
            arguments: null
        );
    }

    public async Task StartAsync()
    {
        if (_channel is null)
        {
            throw new InvalidOperationException("Consumer not initialized.");
        }

        var consumer = new AsyncEventingBasicConsumer(_channel);

        consumer.ReceivedAsync += async (model, ea) =>
        {
            var body = ea.Body.ToArray();
            var message = Encoding.UTF8.GetString(body);

            // Invocar evento de forma segura
            OnMessageReceived?.Invoke(message);

            await Task.CompletedTask; // requerido porque o delegate é async
        };

        await _channel.BasicConsumeAsync(
            queue: "chat",
            autoAck: true,
            consumer: consumer
        );
    }



    public ValueTask DisposeAsync()
    {
        _channel?.Dispose();
        _connection?.Dispose();
        return ValueTask.CompletedTask;
    }
}