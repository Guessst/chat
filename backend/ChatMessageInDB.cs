public class ChatMessageInDB
{
    public int Id { get; set; }
    public string User { get; set; } = string.Empty;
    public string TextContent { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
