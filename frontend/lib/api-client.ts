import { BACKEND_URL } from "./api-urls";
import { getRefreshToken, setToken, removeToken } from "./auth";

interface FetchApiOptions extends RequestInit {
    token?: string;
    bodyData?: unknown;
    isFormData?: boolean;
}

let isRefreshingPromise: Promise<{ access_token: string; refresh_token: string } | null> | null = null;

async function performTokenRefresh(refreshToken: string): Promise<{ access_token: string; refresh_token: string } | null> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) {
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error("Token refresh failed:", err);
        return null;
    }
}

export async function fetchApi(endpoint: string, options: FetchApiOptions = {}) {
    const { token, bodyData, headers, isFormData, ...rest } = options;

    const requestHeaders: Record<string, string> = {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers as Record<string, string>),
    };

    const config: RequestInit = {
        ...rest,
        headers: requestHeaders,
    };

    if (bodyData) {
        config.body = isFormData ? (bodyData as BodyInit) : JSON.stringify(bodyData);
    }

    let response = await fetch(`${BACKEND_URL}${endpoint}`, config);

    // If unauthorized, attempt to refresh the token and retry (unless we are already doing an auth operation)
    if (
        response.status === 401 &&
        endpoint !== "/api/auth/login" &&
        endpoint !== "/api/auth/refresh" &&
        endpoint !== "/api/auth/signup"
    ) {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
            if (!isRefreshingPromise) {
                isRefreshingPromise = performTokenRefresh(refreshToken).then((newTokens) => {
                    if (newTokens) {
                        setToken(newTokens.access_token, newTokens.refresh_token);
                    } else {
                        removeToken();
                        if (typeof window !== "undefined") {
                            window.location.href = "/login";
                        }
                    }
                    isRefreshingPromise = null;
                    return newTokens;
                });
            }

            const newTokens = await isRefreshingPromise;
            if (newTokens) {
                // Retry the request with the new access token
                requestHeaders["Authorization"] = `Bearer ${newTokens.access_token}`;
                response = await fetch(`${BACKEND_URL}${endpoint}`, config);
            }
        }
    }

    // Don't try to parse JSON for No Content responses or Streaming responses
    if (response.status === 204 || response.headers.get("Transfer-Encoding") === "chunked") {
        return response;
    }

    if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }

    try {
        return await response.json();
    } catch {
        return response;
    }
}

