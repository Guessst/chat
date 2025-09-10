using Microsoft.AspNetCore.SignalR;

public class ChatHub : Hub
{
    // Envia mensagem para todos os clientes conectados
    public async Task SendMessage(string user, string message)
    {
        await Clients.All.SendAsync("ReceiveMessage", user, message);
    }
}
