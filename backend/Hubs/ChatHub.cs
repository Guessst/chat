using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

public class ChatHub : Hub
{
    private readonly ChatDbContext _db;
    private readonly IServiceProvider _services;

    public ChatHub(ChatDbContext db, IServiceProvider services)
    {
        _db = db;
        _services = services;
    }

    public async Task SendMessage(string username, string textContent)
    {
        // Validate and format message
        var formattedMessage = ValidateAndFormatMessage(username, textContent);

        // Create DB entity
        var dbMessage = new ChatMessageModel
        {
            Username = formattedMessage.Username,
            TextContent = formattedMessage.TextContent
        };

        try
        {
            // Save to database
            _db.Messages.Add(dbMessage);
            await _db.SaveChangesAsync();

            // Publish message
            var message = new ChatMessage(dbMessage.Id, dbMessage.Username, dbMessage.TextContent, dbMessage.Timestamp);
            var publisher = _services.GetRequiredService<MessagePublisher>();
            string jsonStr = JsonSerializer.Serialize(message);
            publisher.Publish(jsonStr);

            // Optional: send to connected clients
            // await Clients.All.SendAsync("ReceiveMessage", dbMessage.User, message, dbMessage.Timestamp);
        }
        catch (Exception e)
        {
            // Handle/log failure
            throw new InvalidOperationException("Failed to send message.", e);
        }
    }

    private static (string Username, string TextContent) ValidateAndFormatMessage(string username, string textContent)
    {
        if (string.IsNullOrWhiteSpace(username))
            throw new ArgumentException("Username cannot be empty");

        if (username.Length > ChatLimits.MaxUserLength)
            throw new ArgumentException($"Username cannot exceed {ChatLimits.MaxUserLength} characters");

        if (string.IsNullOrWhiteSpace(textContent))
            throw new ArgumentException("Message cannot be empty");

        if (textContent.Length > ChatLimits.MaxMessageLength)
            throw new ArgumentException($"Message cannot exceed {ChatLimits.MaxMessageLength} characters");

        // Basic sanitization: encode HTML
        textContent = System.Net.WebUtility.HtmlEncode(textContent);

        return (username.Trim(), textContent.Trim());
    }
}
