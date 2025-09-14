import * as signalR from "@microsoft/signalr";
import { useEffect, useState } from "react";

interface ChatMessage {
    user: string
    textContent: string
    timestamp: Date
}

function randomObjects(n: number, users: string[], texts: string[]) {
    const m = 10

    return Array.from({ length: n }, () => ({
        user: users[Math.floor(Math.random() * users.length)],
        textContent: Array.from(
            { length: Math.floor(Math.random() * m) + 1 },
            () => texts[Math.floor(Math.random() * texts.length)]
        ).join(" "),
        timestamp: new Date(Date.now()),
    }));
}

function formattedDate(d: Date) {
    return d.toLocaleString("pt-BR", {
        month: "2-digit",  // Sep
        day: "2-digit", // 14
        year: "numeric", // 2025
        hour: "2-digit", // 15
        minute: "2-digit", // 07
        hour12: false    // 24h format
    }).replace(",", "")
};

const TEST_MESSAGE_LIST = randomObjects(
    5,
    ["daniel", "david", "gustavo", "manoel", "nosek"],
    ["salve", "lorem ipsum dolor sit amet", "amém", "こんにちは", "всем привет"],
)

TEST_MESSAGE_LIST[0].textContent = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

export function ChatHub() {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>(TEST_MESSAGE_LIST);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [currentUser, setCurrentUser] = useState<string>("Gustavo")
    const [input, setInput] = useState<string>("");

    const handleSendMessage = () => {
        if ((!!connection) && (!!currentUser) && (input.trim().length > 0)) {
            // !! Não esquecer de sanitizar input no servidor   
            connection.invoke("SendMessage", currentUser, input);
            setInput("");
        }
    }

    const handleReceiveMessage = (receivedUser: string, receivedTextContent: string, receivedTimestamp: string) => {
        // console.log(user, textContent, timestamp);
        const newChatMessage = {
            user: receivedUser,
            textContent: receivedTextContent,
            timestamp: new Date(receivedTimestamp),
        }
        setChatMessages(prev => [...prev, newChatMessage]);
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
            <div className="max-h-[75vh] overflow-y-auto w-full max-w-xl bg-white shadow-lg rounded-2xl flex flex-col p-4">
                <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                    {chatMessages
                        .map(cm => ({ ...cm, timestamp: formattedDate(cm.timestamp) }))
                        .map((cm, i) => (
                            <div key={i} className="p-2 rounded-lg text-gray-800 w-fit">
                                <div className="text-sm space-x-1">
                                    <span><b>{cm.user}</b>,</span>
                                    <span>{cm.timestamp}</span>
                                </div>
                                <div className="whitespace-pre-wrap break-all break-words">{cm.textContent}</div>
                            </div>
                        ))}
                </div>
                <div className="flex items-center space-x-2">
                    <textarea
                        className="flex-1 rounded-2xl border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto max-h-[10vh] min-h-11"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            e.currentTarget.style.height = "auto";       // reset height
                            e.currentTarget.style.height = e.currentTarget.scrollHeight + "px"; // expand
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                            e.currentTarget.style.height = "auto"; // reset after send
                            }
                        }}
                        placeholder="Type a message..."
                        rows={1}
                        />

                    <button
                        onClick={handleSendMessage}
                        className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 hover:cursor-pointer"
                    >
                        {"\u27A4"}
                    </button>
                </div>
            </div>
        </div>
    );
}
