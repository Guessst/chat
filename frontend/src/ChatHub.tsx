import * as signalR from "@microsoft/signalr";
import { ArrowBigRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ENDPOINT_CHAT_HISTORY, WEBSOCKET_ADDRESS } from "./config";
import { CHAT_LIMITS } from "./constants";
import Emojis from "./Emojis";
import { SettingsDialog } from "./SettingsDialog";

const USER_LOCALE = navigator.language || navigator.languages[0];

interface ChatMessage {
    id: number
    username: string
    textContent: string
    timestamp: Date
}

interface UnprocessedChatMessage {
    id: number
    username: string
    textContent: string
    timestamp: string
}

interface FormattedChatMessage {
    id: number
    username: string
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

function getMilisecondsUntilBrazilianMidnight() {
    const now = new Date();

    // current UTC time in ms
    const nowUtc = now.getTime() + now.getTimezoneOffset() * 60_000;

    // offset for Brazil (UTC−3)
    const brazilOffsetMs = -3 * 60 * 60 * 1000;

    // current "Brazil time"
    const nowBrazil = new Date(nowUtc + brazilOffsetMs);

    // next midnight in Brazil
    const nextMidnightBrazil = new Date(nowBrazil);
    nextMidnightBrazil.setHours(24, 0, 0, 0);

    // convert that Brazil midnight back to UTC
    const nextMidnightUtc =
      nextMidnightBrazil.getTime() - brazilOffsetMs;

    // how long until then from now
    const msUntilMidnight = nextMidnightUtc - nowUtc;

    return msUntilMidnight
}

const MessageItem = ({ formattedMessage }: { formattedMessage: FormattedChatMessage }) => {
    return (
        <div key={formattedMessage.id} className="p-2 text-gray-800 w-full">
            <div className="text-sm space-x-1">
                <span><b>{formattedMessage.username}</b>,</span>
                <span>{formattedMessage.timestamp}</span>
            </div>
            <div className="break-words break-all whitespace-pre-wrap">{formattedMessage.textContent}</div>
        </div>
    )
}

const MessageSkeleton = ({ key }: { key: React.Key }) => {
    return (
        <div key={key} className="p-2 rounded-lg w-fit animate-pulse">
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
    )
}

interface ChatMessagesContentInterface {
    isFetchingMessages: boolean
    formattedMessages: FormattedChatMessage[]
    containerRef: React.Ref<HTMLDivElement>
    messagesEndRef: React.Ref<HTMLDivElement>
    handleScroll: () => void
}

// Skeleton OR empty OR messages list
const ChatMessagesContent = ({
    isFetchingMessages,
    formattedMessages,
    containerRef,
    messagesEndRef,
    handleScroll,
}: ChatMessagesContentInterface) => {
    if (isFetchingMessages) {
        return (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (< MessageSkeleton key={i} />))}
            </div>
        )
    }

    if (formattedMessages.length === 0) {
        return (
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto mb-4 flex flex-col items-center justify-center"
                onScroll={handleScroll}
            >
                <div className="p-2 rounded-lg text-center">
                    <div className="italic mt-10 text-gray-400">Be the first to send a message in this chat</div>
                </div>
                <div ref={messagesEndRef} />
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto mb-4 space-y-2"
            onScroll={handleScroll}
        >
            {formattedMessages
                .map(cm => (<MessageItem formattedMessage={cm} />

                ))}
            <div ref={messagesEndRef} />
        </div>
    )
}

export const ChatHub = () => {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [currentUsername, setCurrentUsername] = useLocalStorage("username", "Anonymous")
    const [currentInput, setCurrentInput] = useState<string>("");
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [isFetchingMessages, setIsFetchingMessages] = useState(true);
    // const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const formattedMessages: FormattedChatMessage[] = useMemo(
        () => chatMessages.map(cm => ({ ...cm, timestamp: formattedDate(cm.timestamp) })),
        [chatMessages]
    );

    // ----------------------------------
    // CONNECTION-RELATED FUNCTIONS/HOOKS
    const handleSendMessage = () => {
        if ((!!connection) && (!!currentUsername)) {
            const trimmedInput = currentInput.trim()
            const trimmedUserName = currentUsername.trim()

            const usernameIsInSpec =
                (trimmedUserName.length > 0)
                && trimmedUserName.length <= CHAT_LIMITS.MAX_USERNAME_LENGTH

            const inputIsInSpec =
                (trimmedInput.length > 0)
                && trimmedInput.length <= CHAT_LIMITS.MAX_MESSAGE_LENGTH

            if (inputIsInSpec && usernameIsInSpec) {
                // !! Não esquecer de sanitizar input no servidor   
                connection.invoke("SendMessage", currentUsername, trimmedInput);
                setCurrentInput("");
            }
        }
    }

    const handleReceiveMessage = (receivedId: string, receivedUsername: string, receivedTextContent: string, receivedTimestamp: string) => {
        const newChatMessage = {
            id: Number(receivedId),
            username: receivedUsername,
            textContent: receivedTextContent,
            timestamp: new Date(receivedTimestamp),
        }
        setChatMessages(prev => [...prev, newChatMessage]);
    }

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(WEBSOCKET_ADDRESS)
            .withAutomaticReconnect()
            .build();

        connection.on("ReceiveMessage", handleReceiveMessage);

        connection.start().catch(console.error);

        setConnection(connection);

        fetch(
            ENDPOINT_CHAT_HISTORY, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        }).then(res => res.json()).then((resJson: UnprocessedChatMessage[]) => {
            const messages: ChatMessage[] = resJson.map(m => ({
                id: m.id,
                username: m.username,
                textContent: m.textContent,
                timestamp: new Date(m.timestamp),
            }));

            setIsFetchingMessages(false);

            // NOTE(Gustavo): essa operação provavelmente é custosa
            setChatMessages(prev => [...new Set([...messages, ...prev])]);
        });

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
    const insertAtCursor = (emoji: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        // Insert emoji at cursor position
        const newInput =
            currentInput.substring(0, start) + emoji + currentInput.substring(end);

        setCurrentInput(newInput);

        // Restore focus & move cursor right after the inserted emoji
        requestAnimationFrame(() => {
            textarea.focus();
            const cursorPos = start + emoji.length;
            textarea.setSelectionRange(cursorPos, cursorPos);
        });
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"; // reset
            textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"; // adjust to content
        }
    }, [currentInput]); // runs whenever input changes

    // MISCELANEOUS
    useEffect(() => {
        const msUntilMidnight = getMilisecondsUntilBrazilianMidnight() 
        const timer = setTimeout(() => {
        window.location.reload();
        }, msUntilMidnight);

        return () => clearTimeout(timer);
    }, [])


    return (
        <div>
            <div className="flex justify-center items-center h-30">
                    <h1 className="text-8xl font-inter font-extrabold
                                bg-gradient-to-r from-blue-500 to-purple-500 
                                bg-clip-text text-transparent">
                        The Chat™
                    </h1>
            </div>
            <div className="flex items-center justify-center">
                <div className={`
                relative bg-white shadow-lg rounded-2xl flex flex-col
                w-full md:max-w-9/10 p-8
                max-h-[80vh] md:max-h-[80vh]
                `}> {/* TODO: fix mobile height */}
                    <SettingsDialog setCurrentUsername={setCurrentUsername} currentUsername={currentUsername} />

                    <ChatMessagesContent
                        isFetchingMessages={isFetchingMessages}
                        formattedMessages={formattedMessages}
                        containerRef={containerRef}
                        messagesEndRef={messagesEndRef}
                        handleScroll={handleScroll}
                    />

                    <div className="flex items-center space-x-2">
                        <div className={
                            `flex w-full items-center p-1
                        border border-gray-300 rounded-2xl focus-within:ring-2 focus-within:outline-none
                        ${currentInput.length <= CHAT_LIMITS.MAX_MESSAGE_LENGTH ? `focus-within:ring-blue-500` : `focus-within:ring-red-500`}
                        `
                        }>
                            <textarea
                                ref={textareaRef}
                                className={
                                    `
                            w-full flex px-4 py-2 resize-none overflow-y-auto max-h-[10vh] min-h-11 
                            focus:outline-none focus:border-none
                            `
                                }
                                value={currentInput}
                                onChange={(e) => {
                                    setCurrentInput(e.target.value);
                                    e.currentTarget.style.height = "auto";       // reset height
                                    e.currentTarget.style.height = e.currentTarget.scrollHeight + "px"; // expand
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Type a message..."
                                rows={1}
                            />
                            <Emojis insertAtCursor={insertAtCursor} ></Emojis>
                        </div>
                        <button
                            onClick={handleSendMessage}
                            className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 hover:cursor-pointer"
                        >
                            <ArrowBigRight fill="white" size={22} className="scale-x-120" />
                            {/* {"\u27A4"} */}
                        </button>
                    </div>
                </div>
            </div>
            <footer className="py-4">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-amber-600">
                ⚠️ The Chat™ resets every day at midnight Brazilian Time (UTC -3).
                </div>
            </footer>
        </div>
    );
}
