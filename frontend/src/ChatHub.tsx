import * as signalR from "@microsoft/signalr";
import { useEffect, useRef, useState } from "react";
import { ENDPOINT_CHAT_HISTORY, WEBSOCKET_ADDRESS } from "./config";

const CHAT_LIMITS = {
    MAX_MESSAGE_LENGTH: 2000,
}
const USER_LOCALE = navigator.language || navigator.languages[0];

interface ChatMessage {
    user: string
    textContent: string
    timestamp: Date
}

interface UnprocessedChatMessage {
    user: string
    textContent: string
    timestamp: string
}

function formattedDate(d: Date) {
    return d.toLocaleString(USER_LOCALE, {
        month: "2-digit",  // 09
        day: "2-digit", // 14
        year: "numeric", // 2025
        hour: "2-digit", // 15
        minute: "2-digit", // 07
        hour12: false    // 24h format
    }).replace(",", "")
};


function useLocalStorage(key: string, initialValue: string) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved !== null ? saved : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}

export function ChatHub() {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [currentUser, setCurrentUser] = useLocalStorage("username", USER_LOCALE === "pt-BR" ? "Usuário" : "User")
    const [input, setInput] = useState<string>("");
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [isFetchingMessages, setIsFetchingMessages] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ----------------------------------
    // CONNECTION-RELATED FUNCTIONS/HOOKS
    const handleSendMessage = () => {
        if ((!!connection) && (!!currentUser)) {
            const trimmedInput = input.trim()
            const inputIsInSpec =
                (trimmedInput.length > 0)
                && trimmedInput.length <= CHAT_LIMITS.MAX_MESSAGE_LENGTH

            if (inputIsInSpec) {
                // !! Não esquecer de sanitizar input no servidor   
                connection.invoke("SendMessage", currentUser, trimmedInput);
                setInput("");
            }
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
        // NOTE: estou ciente de que pode ocorrer de fazer fetch de mensagens e
        // chegarem mensagens no websocket antes do retorno.
        fetch(
            ENDPOINT_CHAT_HISTORY, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
       }).then(res => res.json()).then((resJson: UnprocessedChatMessage[]) => {
            const messages: ChatMessage[] = resJson.map(m => ({
                user: m.user,
                textContent: m.textContent,
                timestamp: new Date(m.timestamp),
            }));

            setIsFetchingMessages(false);
            setChatMessages(messages);
        });

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(WEBSOCKET_ADDRESS)
            .withAutomaticReconnect()
            .build();

        connection.on("ReceiveMessage", handleReceiveMessage);

        connection.start().catch(console.error);

        setConnection(connection);

        return () => {
            connection.stop();
        };
    }, []);

    // ----------------------------------
    // SCROLL-RELATED
    const handleScroll = () => {
        if (!containerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        // consider "at bottom" if within 20px of the bottom
        setIsAtBottom(scrollHeight - scrollTop - clientHeight < 20);
    };

    // Auto-scroll only if user is at bottom
    useEffect(() => {
        if (isAtBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages, isAtBottom]);


    // TEXT-AREA RELATED
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"; // reset
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"; // adjust to content
        }
    }, [input]); // runs whenever input changes


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="relative max-h-[75vh] overflow-y-auto w-full max-w-75/100 bg-white shadow-lg rounded-2xl flex flex-col p-4">
                {/* Floating username */}
                {/* Limitar tamanho do username */}
                <input
                    type="text"
                    className="absolute top-6 right-12 text-sm w-[20ch] font-bold px-2 py-1 border rounded-lg shadow-sm bg-white
                                opacity-50
                                focus:opacity-100
                                focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Username"
                    value={currentUser}
                    onChange={(e) => setCurrentUser(e.target.value)}
                />

                {/* Messages */}
                {isFetchingMessages
                ?
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-2 rounded-lg w-fit animate-pulse">
                            {/* username + timestamp */}
                            <div className="flex space-x-2 mb-2">
                            <div className="h-3 w-20 bg-gray-300 rounded"></div>
                            <div className="h-3 w-12 bg-gray-200 rounded"></div>
                            </div>
                            {/* message lines */}
                            <div className="space-y-2">
                            <div className="h-3 w-64 bg-gray-200 rounded"></div>
                            <div className="h-3 w-48 bg-gray-200 rounded"></div>
                            <div className="h-3 w-40 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                        ))}
                    </div>
                :
                    <div
                        ref={containerRef}
                        className="flex-1 overflow-y-auto mb-4 space-y-2"
                        onScroll={handleScroll}
                    >
                        {chatMessages
                            .map(cm => ({ ...cm, timestamp: formattedDate(cm.timestamp) }))
                            .map((cm, i) => (
                                <div key={i} className="p-2 rounded-lg text-gray-800 w-fit">
                                    <div className="text-sm space-x-1">
                                        <span><b>{cm.user}</b>,</span>
                                        <span>{cm.timestamp}</span>
                                    </div>
                                    <div className="break-words break-all whitespace-pre-wrap">{cm.textContent}</div>
                                </div>
                            ))}
                        <div ref={messagesEndRef} />
                    </div>
                }
                <div className="flex items-center space-x-2">
                    <textarea
                        ref={textareaRef}
                        className={
                            `flex-1 rounded-2xl border border-gray-300 px-4 py-2 resize-none overflow-y-auto max-h-[10vh] min-h-11 focus:outline-none focus:ring-2
                            ${input.length <= CHAT_LIMITS.MAX_MESSAGE_LENGTH ? `focus:ring-blue-500` : `focus:ring-red-500`}
                            `
                        }
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            e.currentTarget.style.height = "auto";       // reset height
                            e.currentTarget.style.height = e.currentTarget.scrollHeight + "px"; // expand
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                if (input.length <= CHAT_LIMITS.MAX_MESSAGE_LENGTH) {
                                    handleSendMessage();
                                }
                            }
                        }}
                        placeholder={USER_LOCALE === "pt-BR" ? "Digite uma mensagem..." : "Type a message..."}
                        rows={1}
                    />

                    <button
                        onClick={handleSendMessage}
                        className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 hover:cursor-pointer"
                    >
                        {"\u27A4"}
                    </button>
                </div>
                <p>ENDPOINT_GET_CHAT_HISTORY: {ENDPOINT_CHAT_HISTORY}</p>
                <p>WEBSOCKET_ADDRESS: {WEBSOCKET_ADDRESS}</p>
            </div>
        </div>
    );
}
