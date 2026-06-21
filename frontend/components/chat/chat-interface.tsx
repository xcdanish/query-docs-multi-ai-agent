"use client";

import { useState, useRef, useEffect } from "react";
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
    const [prevChatId, setPrevChatId] = useState<string | undefined>(undefined);

    if (activeChat?.id !== prevChatId) {
        setPrevChatId(activeChat?.id);
        setMessages([]);
        setInput("");
        setFiles([]);
    }

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (activeChat?.id) {
            getMessagesApi(activeChat.id)
                .then((data) => {
                    const mappedMessages = data.map((m) => {
                        let parsedAssets = undefined;
                        if (m.metadata_json && m.metadata_json.assets) {
                            parsedAssets = m.metadata_json.assets as { id: string; file_name: string; file_type: string; }[];
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
        }
    }, [activeChat?.id]);

    async function handleSend() {
        if ((!input.trim() && files.length === 0) || isStreaming) return;

        setIsStreaming(true);

        let currentChat = activeChat;
        if (!currentChat) {
            try {
                const newTitle = input.trim() ? input.trim().slice(0, 30) : "New Chat";
                currentChat = await createChatApi(newTitle);
                window.history.replaceState({}, '', `/chat?id=${currentChat.id}`);
                window.dispatchEvent(new Event('chatCreated'));
                if (onChatCreated) onChatCreated(currentChat);
            } catch (error) {
                console.error("Failed to create chat", error);
                toast.error("Failed to create chat. Please try again.");
                setIsStreaming(false);
                return;
            }
        }

        // Upload files first
        let uploadedFiles = 0;
        const uploadedAssetsData: { id: string, file_name: string, file_type: string }[] = [];
        
        if (files.length > 0) {
            try {
                for (const file of files) {
                    const assetOut = await uploadAssetApi(file);
                    await attachAssetToChatApi(currentChat.id, assetOut.id);
                    uploadedAssetsData.push({
                        id: assetOut.id,
                        file_name: assetOut.file_name,
                        file_type: assetOut.file_type
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

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: finalInput,
            ...(uploadedAssetsData.length > 0 ? { assets: uploadedAssetsData } : {})
        };

        const allMessages = [...messages, userMessage];
        setMessages(allMessages);
        setInput("");
        setFiles([]);

        const aiMessageId = crypto.randomUUID();
        setMessages((prev) => [...prev, { id: aiMessageId, role: "assistant", content: "" }]);

        try {
            abortControllerRef.current = new AbortController();
            const token = getToken();

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ 
                    messages: allMessages, 
                    chatId: currentChat.id,
                    metadata_json: uploadedAssetsData.length > 0 ? { assets: uploadedAssetsData } : undefined
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
    }

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
                        Select a conversation or start a new one.
                    </p>

                    {/* Suggestions */}
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

                    {/* Input on welcome screen */}
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

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-[#fafafa] dark:bg-[#111111]">
            {/* Minimal top bar */}
            <div className="flex h-12 shrink-0 items-center justify-center border-b border-[#eee] dark:border-[#1e1e1e]">
                <p className="text-[13px] font-medium text-[#888] dark:text-[#555]">
                    {activeChat.title}
                </p>
            </div>

            {/* Messages */}
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

            {/* Input */}
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
