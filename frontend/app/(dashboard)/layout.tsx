"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.replace("/login");
        } else {
            setChecking(false);
        }
    }, [router]);

    if (checking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    <span className="text-sm text-slate-400">Loading...</span>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
