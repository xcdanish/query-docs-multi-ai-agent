"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginApi } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { Bot } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await loginApi(username, password);
            setToken(data.access_token, data.refresh_token);
            router.push("/chat");
        } catch {
            toast.error("Invalid username or password");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#212121] p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#10a37f] shadow-lg shadow-[#10a37f]/20">
                        <Bot className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
                    <p className="mt-1 text-sm text-[#8e8ea0]">Sign in to QueryDocs AI</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="username" className="text-sm text-[#b4b4b4]">
                            Username or Email
                        </Label>
                        <Input
                            id="username"
                            placeholder="johndoe"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="h-11 border-[#3a3a3a] bg-[#2f2f2f] text-white placeholder:text-[#6b6b6b] focus:border-[#10a37f] focus:ring-0"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-sm text-[#b4b4b4]">
                            Password
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-11 border-[#3a3a3a] bg-[#2f2f2f] text-white placeholder:text-[#6b6b6b] focus:border-[#10a37f] focus:ring-0"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 h-11 w-full rounded-lg bg-[#10a37f] text-sm font-medium text-white transition-colors duration-150 hover:bg-[#0e9270] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Signing in..." : "Continue"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-[#8e8ea0]">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/signup"
                        className="font-medium text-[#10a37f] transition-colors hover:text-[#12b88f]"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
