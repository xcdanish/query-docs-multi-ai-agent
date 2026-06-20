import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const onest = Onest({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700", "800"],
    variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
    title: "QueryDocs AI — Intelligent Document Assistant",
    description: "Chat with your documents using AI. Powered by QueryDocs.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${onest.variable} h-full`} suppressHydrationWarning>
            <head>
                {/* Prevent flash of wrong theme */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
try {
  var t = localStorage.getItem('qd-theme') || 'dark';
  document.documentElement.classList.toggle('dark', t === 'dark');
} catch(e) {}
            `,
                    }}
                />
            </head>
            <body className="flex min-h-full flex-col font-sans antialiased">
                {children}
                <Toaster richColors position="top-right" />
            </body>
        </html>
    );
}
