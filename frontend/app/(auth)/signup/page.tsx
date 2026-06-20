"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupApi } from "@/lib/api";
import { Bot } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await signupApi(form);
            toast.success("Account created! Please sign in.");
            router.push("/login");
        } catch {
            toast.error("Username or email already exists");
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
                    <h1 className="text-2xl font-semibold text-white">Create an account</h1>
                    <p className="mt-1 text-sm text-[#8e8ea0]">Start using QueryDocs AI for free</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-sm text-[#b4b4b4]">
                                Full Name
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="John Doe"
                                value={form.name}
                                onChange={handleChange}
                                required
                                className="h-11 border-[#3a3a3a] bg-[#2f2f2f] text-white placeholder:text-[#6b6b6b] focus:border-[#10a37f] focus:ring-0"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="username" className="text-sm text-[#b4b4b4]">
                                Username
                            </Label>
                            <Input
                                id="username"
                                name="username"
                                placeholder="johndoe"
                                value={form.username}
                                onChange={handleChange}
                                required
                                className="h-11 border-[#3a3a3a] bg-[#2f2f2f] text-white placeholder:text-[#6b6b6b] focus:border-[#10a37f] focus:ring-0"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm text-[#b4b4b4]">
                            Email
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="john@example.com"
                            value={form.email}
                            onChange={handleChange}
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
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="h-11 border-[#3a3a3a] bg-[#2f2f2f] text-white placeholder:text-[#6b6b6b] focus:border-[#10a37f] focus:ring-0"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 h-11 w-full rounded-lg bg-[#10a37f] text-sm font-medium text-white transition-colors duration-150 hover:bg-[#0e9270] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-[#8e8ea0]">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-[#10a37f] transition-colors hover:text-[#12b88f]"
                    >
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
