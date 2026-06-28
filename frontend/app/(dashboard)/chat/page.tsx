"use client";

import { useState } from "react";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ChatOut } from "@/lib/api";

export default function ChatPage() {
    const [activeChat, setActiveChat] = useState<ChatOut | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-[#fafafa] dark:bg-[#111111]">
            <ChatSidebar
                activeChatId={activeChat?.id ?? null}
                onSelectChat={setActiveChat}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => setIsCollapsed((p) => !p)}
            />
            <ChatInterface 
                activeChat={activeChat} 
                onChatCreated={setActiveChat}
            />
        </div>
    );
}
