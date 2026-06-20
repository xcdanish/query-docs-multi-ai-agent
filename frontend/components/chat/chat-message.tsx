"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
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
                <div
                    className={cn(
                        "max-w-[72%] rounded-2xl rounded-br-md px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap",
                        "bg-[#ececec] text-[#111] dark:bg-[#1e1e1e] dark:text-[#f0f0f0]"
                    )}
                >
                    {message.content}
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
                <div className="text-[14px] leading-[1.75] whitespace-pre-wrap text-[#1a1a1a] dark:text-[#e8e8e8]">
                    {message.content}
                    {isStreaming && (
                        <span className="ml-0.5 inline-block h-[15px] w-[2px] animate-[blink_0.7s_step-end_infinite] bg-[#10a37f] align-middle" />
                    )}
                </div>

                {!isStreaming && message.content && (
                    <div className="mt-2 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
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
