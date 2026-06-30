"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { createChatApi, deleteChatApi, getChatsApi, getMeApi, updateChatApi, logoutApi, ChatOut, UserOut } from "@/lib/api";
import { removeToken, getRefreshToken } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import {
    MessageSquarePlus,
    Trash2,
    LogOut,
    User,
    Settings,
    HelpCircle,
    ChevronUp,
    MessageSquare,
    PanelLeftClose,
    Sun,
    Moon,
    Zap,
    MoreHorizontal,
    Pencil,
} from "lucide-react";

interface ChatSidebarProps {
    activeChatId: string | null;
    onSelectChat: (chat: ChatOut | null) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export function ChatSidebar({
    activeChatId,
    onSelectChat,
    isCollapsed,
    onToggleCollapse,
}: ChatSidebarProps) {
    const router = useRouter();
    const { isDark, toggle: toggleTheme } = useTheme();
    const [chats, setChats] = useState<ChatOut[]>([]);
    const [creating, setCreating] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserOut | null>(null);
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [animatingTitle, setAnimatingTitle] = useState<{ id: string, title: string, currentText: string } | null>(null);
    // Track whether user intentionally clicked "New Chat" — prevents auto-select from overriding
    const newChatModeRef = useRef(false);

    const handleSelectChat = (chat: ChatOut | null) => {
        onSelectChat(chat);
        if (chat) {
            window.history.pushState({}, '', `/chat?id=${chat.id}`);
        } else {
            window.history.pushState({}, '', `/chat`);
        }
    };

    useEffect(() => {
        // Initial load: respect URL param or auto-select first chat
        const initialLoad = () => {
            getChatsApi()
                .then((loadedChats) => {
                    setChats(loadedChats);

                    const params = new URLSearchParams(window.location.search);
                    const chatIdFromUrl = params.get("id");

                    if (chatIdFromUrl) {
                        const foundChat = loadedChats.find((c) => c.id === chatIdFromUrl);
                        if (foundChat) {
                            handleSelectChat(foundChat);
                            return;
                        }
                    }

                    // Auto-select first chat only on initial page load (not when user clicked New Chat)
                    if (loadedChats.length > 0 && !chatIdFromUrl && !newChatModeRef.current) {
                        handleSelectChat(loadedChats[0]);
                    }
                })
                .catch(() => toast.error("Failed to load chats"));
        };

        // After a new chat is created: just refresh the list, don't change selection
        const refreshChatsOnly = () => {
            getChatsApi()
                .then((loadedChats) => {
                    setChats(loadedChats);
                    // newChatModeRef stays false now since chat was created
                    newChatModeRef.current = false;
                })
                .catch(() => toast.error("Failed to load chats"));
        };

        initialLoad();

        window.addEventListener('chatCreated', refreshChatsOnly);

        getMeApi()
            .then(setCurrentUser)
            .catch(() => {
                /* silent */
            });

        const handleAnimateTitle = (e: Event) => {
            const customEvent = e as CustomEvent;
            setAnimatingTitle({
                id: customEvent.detail.chatId,
                title: customEvent.detail.finalTitle,
                currentText: ""
            });
        };
        window.addEventListener('animateChatTitle', handleAnimateTitle);

        return () => {
            window.removeEventListener('chatCreated', refreshChatsOnly);
            window.removeEventListener('animateChatTitle', handleAnimateTitle);
        };
    }, []);

    // Effect for the typing animation
    useEffect(() => {
        if (!animatingTitle || animatingTitle.currentText === animatingTitle.title) return;
        
        const timeout = setTimeout(() => {
            setAnimatingTitle(prev => {
                if (!prev) return null;
                const nextText = prev.title.substring(0, prev.currentText.length + 1);
                return { ...prev, currentText: nextText };
            });
        }, 30); // 30ms per character for fast typing effect
        
        return () => clearTimeout(timeout);
    }, [animatingTitle]);

    function handleNewChat() {
        // Mark that user intentionally wants a new chat — prevents auto-select
        newChatModeRef.current = true;
        handleSelectChat(null);
    }

    function handleRenameChat(e: React.MouseEvent, chatId: string, currentTitle: string) {
        e.stopPropagation();
        setEditingChatId(chatId);
        setEditTitle(currentTitle);
    }

    async function submitRename() {
        if (!editingChatId) return;
        const newTitle = editTitle.trim();
        const currentChat = chats.find(c => c.id === editingChatId);
        
        if (newTitle && currentChat && newTitle !== currentChat.title) {
            try {
                const updatedChat = await updateChatApi(editingChatId, newTitle);
                setChats((prev) => prev.map((c) => c.id === editingChatId ? updatedChat : c));
                if (activeChatId === editingChatId) {
                    onSelectChat(updatedChat);
                }
            } catch {
                toast.error("Failed to rename chat");
            }
        }
        setEditingChatId(null);
    }

    function handleRenameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            submitRename();
        } else if (e.key === "Escape") {
            setEditingChatId(null);
        }
    }

    async function handleDeleteChat(e: React.MouseEvent, chatId: string) {
        e.stopPropagation();
        try {
            await deleteChatApi(chatId);
            setChats((prev) => prev.filter((c) => c.id !== chatId));
        } catch {
            toast.error("Failed to delete chat");
        }
    }

    async function handleLogout() {
        const token = getRefreshToken();
        if (token) {
            try {
                await logoutApi(token);
            } catch (err) {
                console.error("Failed to revoke token", err);
            }
        }
        removeToken();
        router.push("/login");
    }

    const userInitials = currentUser
        ? currentUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
        : "?";

    return (
        <div
            className={cn(
                "flex h-full flex-col overflow-hidden transition-all duration-200 ease-in-out",
                "bg-[#f0f0f0] dark:bg-[#0a0a0a]",
                isCollapsed ? "w-[60px]" : "w-[240px]"
            )}
        >
            {/* ── Header ── */}
            <div
                className={cn(
                    "flex h-14 shrink-0 items-center px-3",
                    isCollapsed ? "justify-center" : "justify-between"
                )}
            >
                {/* Logo — clickable when collapsed to expand sidebar */}
                <button
                    onClick={isCollapsed ? onToggleCollapse : undefined}
                    className={cn(
                        "flex min-w-0 items-center gap-2.5",
                        isCollapsed && "cursor-pointer transition-opacity hover:opacity-80"
                    )}
                    title={isCollapsed ? "Expand sidebar" : undefined}
                >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#10a37f]">
                        <Zap className="h-3.5 w-3.5 text-white" />
                    </div>
                    {!isCollapsed && (
                        <span className="truncate text-[13px] font-semibold tracking-tight text-[#111] select-none dark:text-[#f0f0f0]">
                            QueryDocs
                        </span>
                    )}
                </button>

                {/* Collapse button — only visible when expanded */}
                {!isCollapsed && (
                    <button
                        onClick={onToggleCollapse}
                        title="Collapse sidebar"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-[#999] transition-all hover:bg-[#e0e0e0] hover:text-[#333] dark:hover:bg-[#1f1f1f] dark:hover:text-[#eee]"
                    >
                        <PanelLeftClose className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* ── New Chat ── */}
            <div className={cn("px-2 pt-3 pb-1", isCollapsed && "flex justify-center")}>
                <button
                    onClick={handleNewChat}
                    disabled={creating}
                    title="New chat"
                    className={cn(
                        "flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                        "text-[#555] hover:text-[#111] dark:text-[#888] dark:hover:text-[#f0f0f0]",
                        "hover:bg-[#e0e0e0] dark:hover:bg-[#1a1a1a]",
                        isCollapsed ? "h-10 w-10 justify-center" : "w-full px-3 py-2"
                    )}
                >
                    <MessageSquarePlus className="h-4 w-4 shrink-0" />
                    {!isCollapsed && <span>{creating ? "Creating..." : "New chat"}</span>}
                </button>
            </div>

            {/* ── Chat List ── */}
            <ScrollArea className="flex-1 px-2">
                {!isCollapsed && chats.length > 0 && (
                    <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-[#aaa] uppercase dark:text-[#444]">
                        Recent
                    </p>
                )}

                <div
                    className={cn("space-y-0.5 py-1", isCollapsed && "flex flex-col items-center")}
                >
                    {chats.length === 0 && !isCollapsed ? (
                        <p className="px-3 py-4 text-center text-xs text-[#aaa] dark:text-[#555]">
                            No conversations yet
                        </p>
                    ) : (
                        chats.map((chat) => (
                            <div
                                key={chat.id}
                                onClick={() => handleSelectChat(chat)}
                                title={isCollapsed ? chat.title : undefined}
                                className={cn(
                                    "group flex cursor-pointer items-center justify-between rounded-lg text-[13px] transition-all duration-100",
                                    activeChatId === chat.id
                                        ? "bg-[#e0e0e0] text-[#111] dark:bg-[#1f1f1f] dark:text-[#f0f0f0]"
                                        : "text-[#666] hover:bg-[#e0e0e0] hover:text-[#111] dark:text-[#777] dark:hover:bg-[#1a1a1a] dark:hover:text-[#f0f0f0]",
                                    isCollapsed ? "h-10 w-10 justify-center" : "px-3 py-2"
                                )}
                            >
                                    <div
                                        className={cn(
                                            "flex min-w-0 flex-1 items-center gap-2",
                                            isCollapsed && "justify-center"
                                        )}
                                    >
                                        <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                        {!isCollapsed && (
                                            editingChatId === chat.id ? (
                                                <input
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    onBlur={submitRename}
                                                    onKeyDown={handleRenameKeyDown}
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                    className="w-full bg-transparent outline-none border-b border-[#aaa] dark:border-[#555] text-[13px] text-[#111] dark:text-[#f0f0f0]"
                                                />
                                            ) : (
                                                <span className="truncate">
                                                    {animatingTitle?.id === chat.id ? (
                                                        <>
                                                            {animatingTitle.currentText}
                                                            {animatingTitle.currentText !== animatingTitle.title && (
                                                                <span className="inline-block w-1 h-3 ml-[1px] bg-black dark:bg-white animate-pulse" />
                                                            )}
                                                        </>
                                                    ) : chat.title}
                                                </span>
                                            )
                                        )}
                                    </div>
                                {!isCollapsed && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            onClick={(e) => e.stopPropagation()}
                                            title="Options"
                                            className="ml-1 shrink-0 rounded p-0.5 text-[#bbb] opacity-0 transition-all outline-none group-hover:opacity-100 hover:bg-[#d5d5d5] hover:text-[#333] dark:hover:bg-[#333] dark:hover:text-[#f0f0f0]"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-36 rounded-xl border-[#e5e5e5] bg-white shadow-md dark:border-[#333] dark:bg-[#1a1a1a]"
                                        >
                                            <DropdownMenuItem
                                                onClick={(e) => handleRenameChat(e, chat.id, chat.title)}
                                                className="flex cursor-pointer items-center gap-2 text-[13px] text-[#444] hover:bg-[#f5f5f5] hover:text-[#111] dark:text-[#ccc] dark:hover:bg-[#222] dark:hover:text-white"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) => handleDeleteChat(e, chat.id)}
                                                className="flex cursor-pointer items-center gap-2 text-[13px] text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            {/* ── Bottom: Theme + User ── */}
            <div className={cn("space-y-1 p-2", isCollapsed && "flex flex-col items-center")}>
                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                    className={cn(
                        "flex items-center gap-2.5 rounded-lg text-[13px] transition-all duration-150",
                        "text-[#666] hover:text-[#111] dark:text-[#777] dark:hover:text-[#f0f0f0]",
                        "hover:bg-[#e0e0e0] dark:hover:bg-[#1a1a1a]",
                        isCollapsed ? "h-10 w-10 justify-center" : "w-full px-3 py-2"
                    )}
                >
                    {isDark ? (
                        <Sun className="h-4 w-4 shrink-0" />
                    ) : (
                        <Moon className="h-4 w-4 shrink-0" />
                    )}
                    {!isCollapsed && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
                </button>

                {/* User Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        title={currentUser?.name ?? "Account"}
                        className={cn(
                            "flex items-center gap-2.5 rounded-lg transition-all duration-150 outline-none",
                            "text-[#555] hover:text-[#111] dark:text-[#888] dark:hover:text-[#f0f0f0]",
                            "hover:bg-[#e0e0e0] dark:hover:bg-[#1a1a1a]",
                            isCollapsed ? "h-10 w-10 justify-center" : "w-full px-2 py-1.5"
                        )}
                    >
                        <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="bg-[#10a37f] text-[11px] font-bold text-white">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        {!isCollapsed && (
                            <>
                                <div className="min-w-0 flex-1 text-left">
                                    <p className="truncate text-[13px] leading-tight font-medium text-[#111] dark:text-[#f0f0f0]">
                                        {currentUser?.name ?? "..."}
                                    </p>
                                    <p className="truncate text-[11px] leading-tight text-[#aaa] dark:text-[#555]">
                                        {currentUser?.email ?? ""}
                                    </p>
                                </div>
                                <ChevronUp className="h-3.5 w-3.5 shrink-0 text-[#aaa]" />
                            </>
                        )}
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        side="top"
                        align={isCollapsed ? "center" : "start"}
                        sideOffset={8}
                        className="w-60 rounded-xl border-[#e5e5e5] bg-white p-1 shadow-xl dark:border-[#333] dark:bg-[#1a1a1a]"
                    >
                        <div className="mb-1 px-3 py-2.5">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-[#10a37f] text-sm font-bold text-white">
                                        {userInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-[#111] dark:text-[#f0f0f0]">
                                        {currentUser?.name}
                                    </p>
                                    <p className="truncate text-xs text-[#888] dark:text-[#666]">
                                        {currentUser?.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <DropdownMenuSeparator className="mx-1 bg-[#eee] dark:bg-[#2a2a2a]" />

                        <DropdownMenuItem className="mx-0.5 flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[#333] hover:bg-[#f5f5f5] hover:text-[#111] dark:text-[#ccc] dark:hover:bg-[#222] dark:hover:text-white">
                            <User className="h-4 w-4" /> My Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="mx-0.5 flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[#333] hover:bg-[#f5f5f5] hover:text-[#111] dark:text-[#ccc] dark:hover:bg-[#222] dark:hover:text-white">
                            <Settings className="h-4 w-4" /> Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem className="mx-0.5 flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[#333] hover:bg-[#f5f5f5] hover:text-[#111] dark:text-[#ccc] dark:hover:bg-[#222] dark:hover:text-white">
                            <HelpCircle className="h-4 w-4" /> Help & Support
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="mx-1 my-1 bg-[#eee] dark:bg-[#2a2a2a]" />

                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="mx-0.5 mb-0.5 flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[#333] hover:bg-red-50 hover:text-red-600 dark:text-[#ccc] dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        >
                            <LogOut className="h-4 w-4" /> Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
