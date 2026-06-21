export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const API_URLS = {
    auth: {
        login: "/auth/login",
        signup: "/auth/signup",
        me: "/auth/me",
    },
    chat: {
        get: "/chat/get",
        create: "/chat/create",
        delete: (id: string) => `/chat/delete/${id}`,
        update: (id: string) => `/chat/update/${id}`,
        stream: "/chat/stream",
    },
    messages: {
        get: (chatId: string) => `/chats/${chatId}/messages`,
        create: (chatId: string) => `/chats/${chatId}/messages`,
    },
    assets: {
        get: "/assets",
        upload: "/assets/upload",
        chatAssets: (chatId: string) => `/chats/${chatId}/assets`,
    },
};
