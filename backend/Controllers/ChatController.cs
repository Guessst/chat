using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("chat/")]
public class ChatController : ControllerBase
{
    private readonly MessagePublisher _publisher;

    public ChatController(MessagePublisher publisher)
    {
        _publisher = publisher;
    }

    [HttpGet("print")]
    public IActionResult Print()
    {
        Console.WriteLine("print Hello World!");
        return Ok(); // returns response to client
    }

    [HttpPost("send")]
    public IActionResult Send([FromBody] ChatMessage request)
    {
        Console.WriteLine("executing chat...");

        var json = JsonSerializer.Serialize(request);
        _publisher.Publish(json);

        return Ok();
    }
}

/*
curl -X POST http://localhost:5296/api/chat/send -H "Content-Type: application/json" -d "{\"user\":\"gustavo\", \"message\":\"ola mundo\"}"
*/
public record ChatMessage(string User, string Message);
