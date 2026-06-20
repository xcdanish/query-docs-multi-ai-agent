"use client";

import { useRef, KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
    input: string;
    onInputChange: (value: string) => void;
    onSubmit: () => void;
    loading?: boolean;
    disabled?: boolean;
}

export function ChatInput({ input, onInputChange, onSubmit, loading, disabled }: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (input.trim() && !loading && !disabled) onSubmit();
        }
    }

    function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
        const el = e.target;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 200) + "px";
        onInputChange(el.value);
    }

    const canSend = input.trim() && !loading && !disabled;

    return (
        <div className="px-4 pt-2 pb-5">
            <div
                className={cn(
                    "flex items-end rounded-2xl border transition-colors duration-150",
                    "bg-white dark:bg-[#1a1a1a]",
                    "border-[#e0e0e0] dark:border-[#2a2a2a]",
                    "focus-within:border-[#bbb] dark:focus-within:border-[#444]",
                    "shadow-sm dark:shadow-none"
                )}
            >
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    rows={1}
                    disabled={disabled}
                    className={cn(
                        "flex-1 resize-none bg-transparent px-4 py-3.5 text-[14px] outline-none",
                        "max-h-[200px] overflow-y-auto leading-relaxed",
                        "text-[#111] dark:text-[#f0f0f0]",
                        "placeholder:text-[#bbb] dark:placeholder:text-[#444]",
                        "disabled:cursor-not-allowed"
                    )}
                />
                <div className="shrink-0 p-2 pb-2.5">
                    <button
                        onClick={onSubmit}
                        disabled={!canSend}
                        className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
                            canSend
                                ? "bg-[#111] text-white shadow-sm hover:bg-[#333] dark:bg-[#f0f0f0] dark:text-black dark:hover:bg-[#ddd]"
                                : "cursor-not-allowed bg-[#f0f0f0] text-[#bbb] dark:bg-[#222] dark:text-[#444]"
                        )}
                    >
                        {loading ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#888] border-t-transparent" />
                        ) : (
                            <ArrowUp className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>
            <p className="mt-2 text-center text-[11px] text-[#ccc] dark:text-[#3a3a3a]">
                QueryDocs AI may make mistakes — please verify important information.
            </p>
        </div>
    );
}
