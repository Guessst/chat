import * as signalR from "@microsoft/signalr";
import { useEffect, useState } from "react";

interface ChatMessage {
    user: string
    textContent: string
}

function randomObjects(n: number, users: string[], texts: string[]) {
    const m = 10
    
    return Array.from({ length: n }, () => ({
    user: users[Math.floor(Math.random() * users.length)],
    textContent: Array.from(
      { length: Math.floor(Math.random() * m) + 1 },
      () => texts[Math.floor(Math.random() * texts.length)]
    ).join(" ")
  }));
}

const TEST_MESSAGE_LIST = randomObjects(
    10,
    ["daniel", "david", "gustavo", "manoel", "nosek"],
    ["salve", "lorem ipsum dolor sit amet", "amém", "こんにちは", "всем привет"],
)

export function ChatHub() {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>(TEST_MESSAGE_LIST);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [currentUser, setCurrentUser] = useState<string>("Gustavo")
    const [input, setInput] = useState<string>("");

    const handleSendMessage = () => {
        if ((!!connection) && (!!currentUser) && (input.trim().length > 0)) {
            // !! Não esquecer de sanitizar input no servidor   
            connection.invoke("SendMessage", currentUser, input);
        }
    }

    const handleReceiveMessage = (user: string, textContent: string) => {
        setChatMessages(prev => [...prev, { user, textContent }]);
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
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white shadow-lg rounded-2xl flex flex-col p-4">
                <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                    {chatMessages.map((cm, i) => (
                        <div key={i} className="p-2 rounded-lg text-gray-800 w-fit">
                            <div className="font-bold text-sm">{cm.user}</div>
                            <div>{cm.textContent}</div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center space-x-2">
                    <input
                        className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                    />
                    <button
                        onClick={handleSendMessage}
                        className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 hover:cursor-pointer"
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}
