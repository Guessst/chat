import * as signalR from "@microsoft/signalr";
import { useEffect, useState } from "react";

export function Chat() {
    const [messages, setMessages] = useState<string[]>([]);

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5249/chatHub", { withCredentials: true })
            .withAutomaticReconnect()
            .build();

        connection.start().catch(console.error);

        connection.on("ReceiveMessage", (user, message) => {
            setMessages(prev => [...prev, `${user}: ${message}`]);
            console.log("user", user)
            console.log("message", message)
        });

        return () => {
            connection.stop();
        };
    }, []);

    return (
        <div>
            {messages.map((msg, i) => <div key={i}>{msg}</div>)}
        </div>
    );
}
