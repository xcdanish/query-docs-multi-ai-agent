import { getToken } from "@/lib/auth";

export async function POST(req: Request) {
    const { messages, chatId } = await req.json();
    const token = getToken();

    // Last user message
    const lastMessage = messages[messages.length - 1]?.content ?? "";

    // Call FastAPI backend — swap this URL with your real AI endpoint later
    // For now, stream a placeholder response character by character
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

    // Try to call backend streaming endpoint if it exists
    try {
        const backendRes = await fetch(`${BACKEND_URL}/chat/stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ message: lastMessage, chat_id: chatId }),
        });

        if (backendRes.ok && backendRes.body) {
            return new Response(backendRes.body, {
                headers: { "Content-Type": "text/plain; charset=utf-8" },
            });
        }
    } catch {
        // Backend streaming not available yet — use placeholder
    }

    // Placeholder streaming response (remove when backend AI is ready)
    const placeholderText =
        `I'm QueryDocs AI, your intelligent document assistant! 🤖\n\n` +
        `You asked: "${lastMessage}"\n\n` +
        `I can help you query and analyze your documents once the AI backend is fully configured. ` +
        `Stay tuned — the full AI integration is coming soon!`;

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
