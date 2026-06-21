import { cookies } from "next/headers";
import { fetchApi } from "@/lib/api-client";
import { API_URLS } from "@/lib/api-urls";

export async function POST(req: Request) {
    const { messages, chatId, metadata_json } = await req.json();
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    // Last user message
    const lastMessage = messages[messages.length - 1]?.content ?? "";

    // Common options for fetchApi inside this server context
    const apiOptions = token ? { token } : {};

    // 1. Save user message to the database
    if (lastMessage) {
        try {
            await fetchApi(API_URLS.messages.create(chatId), {
                method: "POST",
                bodyData: { 
                    role: "user", 
                    content: lastMessage,
                    ...(metadata_json ? { metadata_json } : {})
                },
                ...apiOptions,
            });
        } catch (error) {
            console.error("Failed to save user message:", error);
        }
    }

    // 2. Try to call backend streaming endpoint if it exists
    try {
        // Here we use native fetch directly because we need the raw response stream.
        // fetchApi is designed to process JSON normally, so we handle the stream case.
        // Actually fetchApi handles chunked Transfer-Encoding, but native fetch is safer for pure streams here.
        const response = await fetchApi(API_URLS.chat.stream, {
            method: "POST",
            bodyData: { message: lastMessage, chat_id: chatId },
            ...apiOptions,
        });

        if (response instanceof Response && response.ok && response.body) {
            return new Response(response.body, {
                headers: { "Content-Type": "text/plain; charset=utf-8" },
            });
        }
    } catch {
        // Backend streaming not available yet — proceed to placeholder
    }

    // 3. Placeholder streaming response
    const placeholderText =
        `I'm QueryDocs AI, your intelligent document assistant! 🤖\n\n` +
        `You asked: "${lastMessage}"\n\n` +
        `I can help you query and analyze your documents once the AI backend is fully configured. ` +
        `Stay tuned — the full AI integration is coming soon!`;

    // Save AI response immediately to the backend as a placeholder
    try {
        await fetchApi(API_URLS.messages.create(chatId), {
            method: "POST",
            bodyData: { role: "assistant", content: placeholderText, agent_name: "QueryDocs AI" },
            ...apiOptions,
        });
    } catch (error) {
        console.error("Failed to save AI message:", error);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            for (const char of placeholderText) {
                controller.enqueue(encoder.encode(char));
                await new Promise((r) => setTimeout(r, 18));
            }
            controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Transfer-Encoding": "chunked",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
