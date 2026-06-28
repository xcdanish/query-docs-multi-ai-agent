import { BACKEND_URL } from "./api-urls";

interface FetchApiOptions extends RequestInit {
    token?: string;
    bodyData?: unknown;
    isFormData?: boolean;
}

export async function fetchApi(endpoint: string, options: FetchApiOptions = {}) {
    const { token, bodyData, headers, isFormData, ...rest } = options;

    const config: RequestInit = {
        ...rest,
        headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
    };

    if (bodyData) {
        config.body = isFormData ? (bodyData as BodyInit) : JSON.stringify(bodyData);
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, config);

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
