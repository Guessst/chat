public class ChatMessageModel
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string TextContent { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
