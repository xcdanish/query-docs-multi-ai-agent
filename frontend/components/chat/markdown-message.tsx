import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { Check, Copy } from "lucide-react";

interface MarkdownMessageProps {
    content: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
    return (
        <div className="md-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    h1: ({ children }) => <h1 className="text-xl font-semibold mt-3 mb-1.5">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold mt-2.5 mb-1.2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1">{children}</h3>,
                    p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-5 my-1.5 space-y-0.5">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 my-1.5 space-y-0.5">{children}</ol>,
                    li: ({ children }) => <li className="leading-normal">{children}</li>,
                    blockquote: ({ children }) => <blockquote className="border-l-3 border-gray-300 dark:border-gray-600 pl-3 italic text-gray-600 dark:text-gray-400 my-1.5">{children}</blockquote>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    hr: () => <hr className="border-gray-200 dark:border-gray-700 my-3.5" />,
                    pre: ({ children }) => <>{children}</>,
                    code: ({ inline, className, children, ...props }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const language = match ? match[1] : "";
                        const isInline = inline || !match;

                        if (isInline) {
                            return (
                                <code className="rounded bg-neutral-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[13px] font-mono text-neutral-900 dark:text-zinc-100 border border-black/5 dark:border-white/5">
                                    {children}
                                </code>
                            );
                        }

                        return (
                            <CodeBlock language={language} className={className} {...props}>
                                {children}
                            </CodeBlock>
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

// Separate component to hold copy state for each code block
interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
    language: string;
    children: React.ReactNode;
}

function CodeBlock({ language, className, children, ...props }: CodeBlockProps) {
    const [isCopied, setIsCopied] = useState(false);
    const codeRef = useRef<HTMLElement>(null);

    const handleCopy = async () => {
        if (codeRef.current) {
            await navigator.clipboard.writeText(codeRef.current.innerText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <div className="group relative my-2.5 overflow-hidden rounded-lg bg-[#0d1117] border border-gray-200 dark:border-gray-800">
            {/* Header / Top bar */}
            <div className="flex items-center justify-between bg-gray-100 dark:bg-[#161b22] px-4 py-1.5 text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <span className="font-mono">{language || "text"}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded p-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                    {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{isCopied ? "Copied!" : "Copy"}</span>
                </button>
            </div>
            {/* Code Content */}
            <div className="overflow-x-auto p-4 text-sm">
                <pre className={className} {...props}>
                    <code ref={codeRef} className={className}>{children}</code>
                </pre>
            </div>
        </div>
    );
}
