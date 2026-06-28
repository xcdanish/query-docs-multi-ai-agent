"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage, Message } from "./chat-message";
import { ChatInput } from "./chat-input";
import { getToken } from "@/lib/auth";
import { ChatOut, getMessagesApi, uploadAssetApi, attachAssetToChatApi, createChatApi } from "@/lib/api";
import { Zap, FileText, BarChart2, GitCompare, Table } from "lucide-react";
import { toast } from "sonner";

interface ChatInterfaceProps {
    activeChat: ChatOut | null;
    onChatCreated?: (chat: ChatOut) => void;
}

const SUGGESTIONS = [
    { icon: FileText, label: "Summarize a document" },
    { icon: BarChart2, label: "Find key insights" },
    { icon: GitCompare, label: "Compare two files" },
    { icon: Table, label: "Extract data tables" },
];

export function ChatInterface({ activeChat, onChatCreated }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * justCreatedChatIdRef — stored when we manually call createChatApi,
     * so that in useEffect the messages do not reset (as they are already in the state).
     */
    const justCreatedChatIdRef = useRef<string | null>(null);

    // ── Auto-scroll whenever messages update ──
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // ── Reset/Load messages when active chat switches ──
    useEffect(() => {
        if (!activeChat?.id) {
            // Welcome screen / New Chat mode — clear existing messages
            setMessages([]);
            setInput("");
            setFiles([]);
            return;
        }

        // If this chat was just created, messages are already in state
        // Do not reset — just clear the ref
        if (justCreatedChatIdRef.current === activeChat.id) {
            justCreatedChatIdRef.current = null;
            return;
        }

        // Select existing chat — reset and fetch messages from API
        setMessages([]);
        setInput("");
        setFiles([]);

        getMessagesApi(activeChat.id)
            .then((data) => {
                const mappedMessages = data.map((m) => {
                    let parsedAssets = undefined;
                    if (m.metadata_json && m.metadata_json.assets) {
                        parsedAssets = m.metadata_json.assets as { id: string; file_name: string; file_type: string }[];
                    }
                    return {
                        id: m.id,
                        role: m.role as "user" | "assistant" | "system",
                        content: m.content,
                        assets: parsedAssets,
                    };
                });
                setMessages(mappedMessages);
            })
            .catch(console.error);
    }, [activeChat?.id]);

    const handleSend = useCallback(async () => {
        if ((!input.trim() && files.length === 0) || isStreaming) return;

        setIsStreaming(true);

        // ── Step 1: Create chat if it does not exist ──
        let currentChat = activeChat;
        if (!currentChat) {
            try {
                const finalTitle = input.trim() ? input.trim().slice(0, 50) : "New Chat";
                const newChat = await createChatApi(finalTitle);

                // Save this ID so useEffect doesn't reset messages
                justCreatedChatIdRef.current = newChat.id;

                currentChat = newChat;

                // Update URL
                window.history.replaceState({}, "", `/chat?id=${newChat.id}`);

                // Refresh sidebar (new chat will appear in the list)
                window.dispatchEvent(new Event("chatCreated"));
                // Trigger typing animation in the sidebar for the new chat
                window.dispatchEvent(new CustomEvent("animateChatTitle", { 
                    detail: { chatId: newChat.id, finalTitle } 
                }));

                // Notify parent (activeChat prop will be updated)
                if (onChatCreated) onChatCreated(newChat);
            } catch (error) {
                console.error("Failed to create chat", error);
                toast.error("Failed to create chat. Please try again.");
                setIsStreaming(false);
                return;
            }
        }

        // ── Step 2: Upload files ──
        let uploadedFiles = 0;
        const uploadedAssetsData: { id: string; file_name: string; file_type: string }[] = [];

        if (files.length > 0) {
            try {
                for (const file of files) {
                    const assetOut = await uploadAssetApi(file);
                    await attachAssetToChatApi(currentChat.id, assetOut.id);
                    uploadedAssetsData.push({
                        id: assetOut.id,
                        file_name: assetOut.file_name,
                        file_type: assetOut.file_type,
                    });
                    uploadedFiles++;
                }
            } catch (error) {
                console.error("File upload failed", error);
                toast.error("Failed to upload files. Please try again.");
                setIsStreaming(false);
                return;
            }
        }

        const finalInput = input || (uploadedFiles > 0 ? `[Attached ${uploadedFiles} file(s)]` : "");

        // ── Step 3: Show user message immediately ──
        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: finalInput,
            ...(uploadedAssetsData.length > 0 ? { assets: uploadedAssetsData } : {}),
        };

        const aiMessageId = crypto.randomUUID();
        const aiPlaceholder: Message = { id: aiMessageId, role: "assistant", content: "" };

        setMessages((prev) => [...prev, userMessage, aiPlaceholder]);
        setInput("");
        setFiles([]);

        // ── Step 4: Stream AI response ──
        try {
            abortControllerRef.current = new AbortController();
            const token = getToken();

            const response = await fetch("/api/ask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    chatId: currentChat.id,
                    metadata_json: uploadedAssetsData.length > 0 ? { assets: uploadedAssetsData } : undefined,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok || !response.body) throw new Error("Stream failed");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === aiMessageId ? { ...msg, content: msg.content + chunk } : msg
                    )
                );
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name !== "AbortError") {
                toast.error("Something went wrong. Please try again.");
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === aiMessageId
                            ? { ...msg, content: "Something went wrong. Please try again." }
                            : msg
                    )
                );
            }
        } finally {
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    }, [activeChat, input, files, isStreaming, messages, onChatCreated]);

    // ── Welcome Screen (activeChat null) ──
    if (!activeChat) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center bg-[#fafafa] px-4 pb-16 dark:bg-[#111111]">
                <div className="flex w-full max-w-3xl flex-col items-center">
                    {/* Hero */}
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10a37f] shadow-lg shadow-[#10a37f]/20">
                        <Zap className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="mb-2 text-[22px] font-semibold tracking-tight text-[#111] dark:text-[#f0f0f0]">
                        How can I help you today?
                    </h2>
                    <p className="mb-8 text-center text-sm text-[#888] dark:text-[#666]">
                        Start a new conversation or select one from the sidebar.
                    </p>

                    {/* Suggestion chips */}
                    <div className="mb-6 grid w-full grid-cols-2 gap-2">
                        {SUGGESTIONS.map(({ icon: Icon, label }) => (
                            <button
                                key={label}
                                onClick={() => setInput(label)}
                                className="group flex items-center gap-3 rounded-xl border border-[#e5e5e5] bg-white px-4 py-3.5 text-left text-sm font-medium text-[#555] shadow-sm transition-all duration-150 hover:border-[#10a37f]/50 hover:bg-[#f5fdf9] hover:text-[#111] hover:shadow dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-[#888] dark:hover:bg-[#1a2420] dark:hover:text-[#f0f0f0]"
                            >
                                <Icon className="h-4 w-4 shrink-0 text-[#10a37f]" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Input box on welcome screen */}
                    <div className="w-full">
                        <ChatInput
                            input={input}
                            onInputChange={setInput}
                            onSubmit={handleSend}
                            loading={isStreaming}
                            files={files}
                            onFilesChange={setFiles}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // ── Active Chat Screen ──
    return (
        <div className="flex min-h-0 flex-1 flex-col bg-[#fafafa] dark:bg-[#111111]">
            {/* Top bar — chat title */}
            <div className="flex h-12 shrink-0 items-center justify-center border-b border-[#eee] dark:border-[#1e1e1e]">
                <p className="text-[13px] font-medium text-[#888] dark:text-[#555]">
                    {activeChat.title}
                </p>
            </div>

            {/* Messages area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-3xl py-8">
                    {messages.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-sm text-[#aaa] dark:text-[#444]">
                                Send a message to begin
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {messages.map((msg) => (
                                <ChatMessage
                                    key={msg.id}
                                    message={msg}
                                    isStreaming={
                                        isStreaming &&
                                        msg.role === "assistant" &&
                                        msg === messages[messages.length - 1]
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Input box */}
            <div className="mx-auto w-full max-w-3xl">
                <ChatInput
                    input={input}
                    onInputChange={setInput}
                    onSubmit={handleSend}
                    loading={isStreaming}
                    files={files}
                    onFilesChange={setFiles}
                />
            </div>
        </div>
    );
}
