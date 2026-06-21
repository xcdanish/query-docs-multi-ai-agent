"use client";

import { useRef, KeyboardEvent } from "react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ArrowUp,
    Plus,
    Paperclip,
    FileClock,
    Image as ImageIcon,
    Telescope,
    Globe,
    MoreHorizontal,
    X,
    File as FileIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatInputProps {
    input: string;
    onInputChange: (value: string) => void;
    onSubmit: () => void;
    loading?: boolean;
    disabled?: boolean;
    files?: File[];
    onFilesChange?: (files: File[]) => void;
}

export function ChatInput({
    input,
    onInputChange,
    onSubmit,
    loading,
    disabled,
    files = [],
    onFilesChange,
}: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const canSend = (input.trim() || files.length > 0) && !loading && !disabled;

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && onFilesChange) {
            const newFiles = Array.from(e.target.files);
            const totalFiles = files.length + newFiles.length;

            if (totalFiles > 5) {
                toast.error("You can only upload up to 5 files at a time.");
                const allowedNewFiles = newFiles.slice(0, Math.max(0, 5 - files.length));
                if (allowedNewFiles.length > 0) {
                    onFilesChange([...files, ...allowedNewFiles]);
                }
            } else {
                onFilesChange([...files, ...newFiles]);
            }
        }
        // reset input so the same files can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function removeFile(index: number) {
        if (onFilesChange) {
            const newFiles = [...files];
            newFiles.splice(index, 1);
            onFilesChange(newFiles);
        }
    }

    return (
        <div className="px-4 pt-2 pb-5">
            <div
                className={cn(
                    "flex flex-col rounded-2xl border transition-colors duration-150",
                    "bg-white dark:bg-[#1a1a1a]",
                    "border-[#e0e0e0] dark:border-[#2a2a2a]",
                    "focus-within:border-[#bbb] dark:focus-within:border-[#444]",
                    "shadow-sm dark:shadow-none"
                )}
            >
                {/* Hidden File Input */}
                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.csv,.txt,.md,.doc,.docx"
                />

                {/* File Previews */}
                {files && files.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-3 pt-3">
                        {files.map((file, i) => (
                            <div
                                key={i}
                                className="group relative flex items-center gap-2 rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-2 pr-3 dark:border-[#333] dark:bg-[#222]"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-[#111]">
                                    {file.type.startsWith("image/") ? (
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="preview"
                                            className="h-full w-full rounded-lg object-cover"
                                        />
                                    ) : (
                                        <FileIcon className="h-4 w-4 text-[#888] dark:text-[#aaa]" />
                                    )}
                                </div>
                                <div className="flex max-w-[120px] flex-col overflow-hidden text-[12px]">
                                    <span className="truncate font-medium text-[#333] dark:text-[#ccc]">
                                        {file.name}
                                    </span>
                                    <span className="text-[#888] dark:text-[#666]">
                                        {file.type.split("/")[1]?.toUpperCase() || "FILE"}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeFile(i)}
                                    className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#ccc] text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#999] dark:bg-[#444] dark:hover:bg-[#666]"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Input row */}
                <div className="flex items-end pr-1 pl-1">
                    <div className="shrink-0 p-2 pb-2.5">
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                disabled={disabled}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-[#bbb] transition-all duration-150 outline-none hover:bg-[#f5f5f5] hover:text-[#555] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#666] dark:hover:bg-[#2a2a2a] dark:hover:text-[#ccc]"
                            >
                                <Plus className="h-5 w-5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                align="start"
                                sideOffset={12}
                                className="w-64 rounded-xl border-[#e5e5e5] bg-white p-2 shadow-lg dark:border-[#333] dark:bg-[#1a1a1a]"
                            >
                                <DropdownMenuItem
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-[#111] hover:bg-[#f5f5f5] dark:text-[#f0f0f0] dark:hover:bg-[#2a2a2a]"
                                >
                                    <Paperclip className="h-4 w-4 shrink-0 text-[#666] dark:text-[#aaa]" />
                                    Add photos & files
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-[#111] hover:bg-[#f5f5f5] dark:text-[#f0f0f0] dark:hover:bg-[#2a2a2a]">
                                    <FileClock className="h-4 w-4 shrink-0 text-[#666] dark:text-[#aaa]" />
                                    Recent files
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="mx-1 my-1 bg-[#eee] dark:bg-[#2a2a2a]" />
                                <DropdownMenuItem className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-[#111] hover:bg-[#f5f5f5] dark:text-[#f0f0f0] dark:hover:bg-[#2a2a2a]">
                                    <ImageIcon className="h-4 w-4 shrink-0 text-[#666] dark:text-[#aaa]" />
                                    Create image
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-[#111] hover:bg-[#f5f5f5] dark:text-[#f0f0f0] dark:hover:bg-[#2a2a2a]">
                                    <Telescope className="h-4 w-4 shrink-0 text-[#666] dark:text-[#aaa]" />
                                    Deep research
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-[#111] hover:bg-[#f5f5f5] dark:text-[#f0f0f0] dark:hover:bg-[#2a2a2a]">
                                    <Globe className="h-4 w-4 shrink-0 text-[#666] dark:text-[#aaa]" />
                                    Web search
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="mx-1 my-1 bg-[#eee] dark:bg-[#2a2a2a]" />
                                <DropdownMenuItem className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-[#111] hover:bg-[#f5f5f5] dark:text-[#f0f0f0] dark:hover:bg-[#2a2a2a]">
                                    <MoreHorizontal className="h-4 w-4 shrink-0 text-[#666] dark:text-[#aaa]" />
                                    More
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything..."
                        rows={1}
                        disabled={disabled}
                        className={cn(
                            "flex-1 resize-none bg-transparent px-2 py-3.5 text-[15px] outline-none",
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
            </div>
            <p className="mt-2 text-center text-[11px] text-[#ccc] dark:text-[#3a3a3a]">
                QueryDocs AI may make mistakes — please verify important information.
            </p>
        </div>
    );
}
