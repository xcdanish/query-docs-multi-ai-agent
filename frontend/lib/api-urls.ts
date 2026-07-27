export const BACKEND_URL =
    typeof window === "undefined"
        ? process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005"
        : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005";

// All backend routes have /api prefix
export const API_URLS = {
    auth: {
        login: "/api/auth/login",
        signup: "/api/auth/signup",
        me: "/api/auth/me",
        refresh: "/api/auth/refresh",
        logout: "/api/auth/logout",
    },
    chat: {
        get: "/api/chat/get",
        create: "/api/chat/create",
        delete: (id: string) => `/api/chat/delete/${id}`,
        update: (id: string) => `/api/chat/update/${id}`,
        ask: "/api/chat/ask",
    },
    messages: {
        get: (chatId: string) => `/api/chats/${chatId}/messages`,
        create: (chatId: string) => `/api/chats/${chatId}/messages`,
    },
    assets: {
        get: "/api/assets",
        upload: "/api/assets/upload",
        chatAssets: (chatId: string) => `/api/chats/${chatId}/assets`,
    },
};
