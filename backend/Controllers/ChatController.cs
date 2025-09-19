using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("chat/")]
public class ChatController : ControllerBase
{
    private readonly ChatDbContext _db;


    public ChatController(ChatDbContext db)
    {
        _db = db;
    }
    
    [HttpGet]
    public async Task<IEnumerable<ChatMessage>> GetMessages()
    {
        return await _db.Messages
            .OrderBy(m => m.Timestamp)
            .Select(m => new ChatMessage(
                m.Id,
                m.Username,          // map to ChatMessage.User
                m.TextContent,   // map to ChatMessage.TextContent
                m.Timestamp      // map to ChatMessage.Timestamp
            ))
            .ToListAsync();
    }
}
/*
curl -X POST http://localhost:5296/api/chat/send -H "Content-Type: application/json" -d "{\"user\":\"gustavo\", \"message\":\"ola mundo\"}"
*/
