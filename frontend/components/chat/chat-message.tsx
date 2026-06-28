"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { MarkdownMessage } from "./markdown-message";

export interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    assets?: { id: string, file_name: string, file_type: string }[];
}

interface ChatMessageProps {
    message: Message;
    isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
    const isUser = message.role === "user";
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        await navigator.clipboard.writeText(message.content);
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    }

    if (isUser) {
        return (
            <div className="flex justify-end px-4 py-1.5">
                <div className="flex max-w-[72%] flex-col items-end gap-1.5">
                    {/* Render attached files if any */}
                    {message.assets && message.assets.length > 0 && (
                        <div className="flex flex-wrap justify-end gap-2">
                            {message.assets.map((asset) => (
                                <div key={asset.id} className="flex items-center gap-2 rounded-xl bg-white p-2 pr-3 shadow-sm border border-[#e5e5e5] dark:border-[#333] dark:bg-[#222]">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5] dark:bg-[#111]">
                                        {/* Basic File Icon */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#888] dark:text-[#aaa]"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                                    </div>
                                    <div className="flex max-w-[140px] flex-col overflow-hidden text-[12px]">
                                        <span className="truncate font-medium text-[#333] dark:text-[#ccc]">{asset.file_name}</span>
                                        <span className="text-[#888] dark:text-[#666]">{asset.file_type.split('/')[1]?.toUpperCase() || "FILE"}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div
                        className={cn(
                            "rounded-2xl rounded-br-md px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap",
                            "bg-[#ececec] text-[#111] dark:bg-[#1e1e1e] dark:text-[#f0f0f0]"
                        )}
                    >
                        {message.content}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="group flex gap-3 px-4 py-3">
            <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                <AvatarFallback className="bg-[#10a37f] text-white">
                    <Bot className="h-4 w-4" />
                </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
                <div className="text-[14px] leading-relaxed text-[#0d0d0d] dark:text-[#ececec] max-w-3xl w-full">
                    {!message.content && isStreaming ? (
                        <div className="flex items-center h-[24.5px] gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#10a37f] animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-[#10a37f] animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="h-1.5 w-1.5 rounded-full bg-[#10a37f] animate-bounce"></span>
                        </div>
                    ) : (
                        <MarkdownMessage content={message.content + (isStreaming ? " ▍" : "")} />
                    )}
                </div>

                {!isStreaming && message.content && (
                    <div className="mt-2 flex items-center gap-0.5 transition-opacity duration-150">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-[#999] transition-all hover:bg-[#f0f0f0] hover:text-[#333] dark:text-[#555] dark:hover:bg-[#1e1e1e] dark:hover:text-[#ccc]"
                        >
                            <Copy className="h-3.5 w-3.5" />
                            {copied ? "Copied!" : "Copy"}
                        </button>
                        <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-[#999] transition-all hover:bg-[#f0f0f0] hover:text-[#333] dark:text-[#555] dark:hover:bg-[#1e1e1e] dark:hover:text-[#ccc]">
                            <ThumbsUp className="h-3.5 w-3.5" />
                        </button>
                        <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-[#999] transition-all hover:bg-[#f0f0f0] hover:text-[#333] dark:text-[#555] dark:hover:bg-[#1e1e1e] dark:hover:text-[#ccc]">
                            <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
