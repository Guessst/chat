using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;

public class ChatHub : Hub
{
    private readonly ChatDbContext _db;
    private readonly IServiceProvider _services;

    public ChatHub(ChatDbContext db, IServiceProvider services)
    {
        _db = db;
        _services = services;
    }

    public async Task SendMessage(string user, string textContent)
    {
        // Console.WriteLine($"SendMessage: user: {user}, textContent: {textContent}");
        var dbMessage = new ChatMessageModel { User = user, TextContent = user };
        var message = new ChatMessage(user, textContent, dbMessage.Timestamp);

        _db.Messages.Add(dbMessage);
        await _db.SaveChangesAsync();

        MessagePublisher publisher = _services.GetRequiredService<MessagePublisher>();
        string jsonStr = JsonSerializer.Serialize(message);
        publisher.Publish(jsonStr);

        // await Clients.All.SendAsync("ReceiveMessage", user, message, dbMessage.Timestamp);
    }
}
