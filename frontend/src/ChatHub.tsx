import * as signalR from "@microsoft/signalr";
import { useEffect, useState } from "react";

export function ChatHub() {
    const [messages, setMessages] = useState<string[]>([]);
    const [connection, setConnection] = useState<signalR.HubConnection|null>(null);

    const handleSendMessage = (user: string, message: string) => {
        if(!!connection) connection.invoke("SendMessage", user, message);
    }

    const handleReceiveMessage = (user: string, message: string) => {
        setMessages(prev => [...prev, `${user}: ${message}`]);
        // console.log("user", user)
        // console.log("message", message)
    }

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5249/chatHub")
            .withAutomaticReconnect()
            .build();

        connection.on("ReceiveMessage", handleReceiveMessage);

        connection.start().catch(console.error);
        
        setConnection(connection);

        return () => {
            connection.stop();
        };
    }, []);

    return (
        <div>
            <div>
                {messages.map((msg, i) => <p key={i}>{msg}</p>)}
            </div>
            <button onClick={() => handleSendMessage("123", "456")}>enviar teste</button>
        </div>
    );
}
