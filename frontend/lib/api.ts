import { API_URLS } from "./api-urls";
import { fetchApi } from "./api-client";
import { getToken } from "./auth";

// Get token for authenticated requests
function getAuthOptions() {
    const token = getToken();
    return token ? { token } : {};
}

// Auth endpoints

export async function loginApi(username: string, password: string) {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetchApi(API_URLS.auth.login, {
        method: "POST",
        bodyData: formData,
        isFormData: true,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response as { access_token: string; refresh_token: string; token_type: string };
}

export async function refreshApi(refreshToken: string) {
    const response = await fetchApi(API_URLS.auth.refresh, {
        method: "POST",
        bodyData: { refresh_token: refreshToken },
    });
    return response as { access_token: string; refresh_token: string; token_type: string };
}

export async function logoutApi(refreshToken: string) {
    return fetchApi(API_URLS.auth.logout, {
        method: "POST",
        bodyData: { refresh_token: refreshToken },
    });
}


export async function signupApi(payload: {
    name: string;
    username: string;
    email: string;
    password: string;
}) {
    return fetchApi(API_URLS.auth.signup, {
        method: "POST",
        bodyData: payload,
    });
}

export async function getMeApi() {
    return fetchApi(API_URLS.auth.me, {
        method: "GET",
        ...getAuthOptions(),
    });
}

// Chat endpoints

export async function getChatsApi() {
    const data = await fetchApi(API_URLS.chat.get, {
        method: "GET",
        ...getAuthOptions(),
    });
    return data as ChatOut[];
}

export async function createChatApi(title: string) {
    const data = await fetchApi(API_URLS.chat.create, {
        method: "POST",
        bodyData: { title },
        ...getAuthOptions(),
    });
    return data as ChatOut;
}

export async function deleteChatApi(chatId: string) {
    return fetchApi(API_URLS.chat.delete(chatId), {
        method: "DELETE",
        ...getAuthOptions(),
    });
}

export async function updateChatApi(chatId: string, title: string): Promise<ChatOut> {
    return fetchApi(API_URLS.chat.update(chatId), {
        method: "PATCH",
        bodyData: { title },
        ...getAuthOptions(),
    });
}

// File and asset endpoints

export async function uploadAssetApi(file: File): Promise<AssetOut> {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await fetchApi(API_URLS.assets.upload, {
        method: "POST",
        bodyData: formData,
        isFormData: true,
        ...getAuthOptions(),
    }) as { data: AssetOut };
    return response.data;
}

export async function attachAssetToChatApi(chatId: string, assetId: string): Promise<void> {
    await fetchApi(API_URLS.assets.chatAssets(chatId), {
        method: "POST",
        bodyData: { asset_id: assetId },
        ...getAuthOptions(),
    });
}

// Message endpoints

export async function getMessagesApi(chatId: string) {
    const data = await fetchApi(API_URLS.messages.get(chatId), {
        method: "GET",
        ...getAuthOptions(),
    });
    return data as MessageOut[];
}

export async function createMessageApi(
    chatId: string,
    payload: { role: string; content: string; agent_name?: string }
) {
    const data = await fetchApi(API_URLS.messages.create(chatId), {
        method: "POST",
        bodyData: payload,
        ...getAuthOptions(),
    });
    return data as MessageOut;
}

// API response interfaces

export interface ChatOut {
    id: string;
    user_id: string;
    title: string;
    created_at: string;
    is_empty?: boolean;
}

export interface UserOut {
    id: string;
    name: string;
    username: string;
    email: string;
}

export interface MessageOut {
    id: string;
    chat_id: string;
    role: "user" | "assistant" | "system";
    agent_name?: string;
    content: string;
    metadata_json?: Record<string, unknown>;
    created_at: string;
}

export interface AssetOut {
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    status: string;
    created_at: string;
    updated_at: string;
}


