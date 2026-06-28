import { cookies, headers } from "next/headers";
import { fetchApi } from "@/lib/api-client";
import { API_URLS, BACKEND_URL } from "@/lib/api-urls";

export async function POST(req: Request) {
    const { messages, chatId, metadata_json } = await req.json();

    // ── Extract Token — try both cookie and Authorization header ──
    const cookieStore = await cookies();
    const headerStore = await headers();

    const cookieToken = cookieStore.get("auth_token")?.value;
    const authHeader = headerStore.get("authorization") ?? headerStore.get("Authorization");
    const headerToken = authHeader?.replace(/^Bearer\s+/i, "");

    // Prioritize cookie token, otherwise use header token
    const token = cookieToken || headerToken;

    if (!token) {
        console.error("No auth token found — cannot call backend stream");
    }

    // Last user message
    const lastMessage = messages[messages.length - 1]?.content ?? "";

    const apiOptions = token ? { token } : {};

    // ── Step 1: Save User Message in DB ──
    if (lastMessage) {
        try {
            await fetchApi(API_URLS.messages.create(chatId), {
                method: "POST",
                bodyData: {
                    role: "user",
                    content: lastMessage,
                    ...(metadata_json ? { metadata_json } : {}),
                },
                ...apiOptions,
            });
        } catch (error) {
            console.error("Failed to save user message:", error);
        }
    }

    // ── Step 2: Call Backend /chat/stream ──
    let backendError = "";
    if (token) {
        try {
            const streamRes = await fetch(`${BACKEND_URL}${API_URLS.chat.ask}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message: lastMessage,
                    chat_id: chatId,
                }),
            });

            if (streamRes.ok && streamRes.body) {
                return new Response(streamRes.body, {
                    headers: {
                        "Content-Type": "text/plain; charset=utf-8",
                        "Transfer-Encoding": "chunked",
                        "X-Content-Type-Options": "nosniff",
                    },
                });
            }

            const errText = await streamRes.text().catch(() => "unknown");
            console.error(`Backend stream error ${streamRes.status}:`, errText);
            backendError = `[DEBUG] Backend ${streamRes.status}: ${errText}`;
        } catch (error) {
            console.error("Backend stream call failed:", error);
            backendError = `[DEBUG] Fetch failed: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    // ── Fallback ──
    const errorText = backendError
        || (token ? "AI backend error. Please try again." : "Authentication error. Please log in again.");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            for (const char of errorText) {
                controller.enqueue(encoder.encode(char));
                await new Promise((r) => setTimeout(r, 10));
            }
            controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Transfer-Encoding": "chunked",
        },
    });
}
