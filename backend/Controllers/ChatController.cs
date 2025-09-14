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
    public async Task<IEnumerable<ChatMessageModel>> GetMessages()
    {
        return await _db.Messages
            .OrderBy(m => m.Timestamp)
            .ToListAsync();
    }
}
/*
curl -X POST http://localhost:5296/api/chat/send -H "Content-Type: application/json" -d "{\"user\":\"gustavo\", \"message\":\"ola mundo\"}"
*/
