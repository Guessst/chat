using System.Text.Json;
using Microsoft.AspNetCore.SignalR;

public class ChatHub : Hub
{
    private readonly ChatContext _db;
    private readonly IServiceProvider _services;

    public ChatHub(ChatContext db, IServiceProvider services)
    {
        _db = db;
        _services = services;
    }

    public async Task SendMessage(string user, string textContent)
    {
        // Console.WriteLine($"SendMessage: user: {user}, textContent: {textContent}");
        var dbMessage = new ChatMessageInDB { User = user, TextContent = user };
        var message = new ChatMessage(user, textContent, dbMessage.Timestamp);

        _db.Messages.Add(dbMessage);
        await _db.SaveChangesAsync();

        var publisher = _services.GetRequiredService<MessagePublisher>();
        var json = JsonSerializer.Serialize(message);
        publisher.Publish(json);

        // await Clients.All.SendAsync("ReceiveMessage", user, message, dbMessage.Timestamp);
    }
}
