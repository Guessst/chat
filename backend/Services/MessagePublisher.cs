using RabbitMQ.Client;
using System.Text;

public class MessagePublisher : IAsyncDisposable
{
    private IConnection? _connection;
    private IChannel? _channel;

    public async Task InitializeAsync()
    {
        var factory = new ConnectionFactory() { HostName = "localhost" };
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

    public async void Publish(string message)
    {
        if (_channel is null)
        {
            throw new InvalidOperationException("Publisher not initialized.");
        }

        var body = Encoding.UTF8.GetBytes(message);
        await _channel.BasicPublishAsync(
            exchange: "",
            routingKey: "chat",
            mandatory: false,
            basicProperties: new BasicProperties(),
            body: body
        );
    }

    public ValueTask DisposeAsync()
    {
        _channel?.Dispose();
        _connection?.Dispose();
        return ValueTask.CompletedTask;
    }
}
