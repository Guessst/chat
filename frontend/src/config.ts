const SERVER_IP = import.meta.env.VITE_BACKEND_SERVER_IP

export const WEBSOCKET_ADDRESS = `${SERVER_IP}:5249/chatHub`;
export const ENDPOINT_GET_CHAT_HISTORY = `${SERVER_IP}:5249/chat`;
