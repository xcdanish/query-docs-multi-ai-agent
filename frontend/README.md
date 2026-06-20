frontend/
├── app/
│ ├── api/
│ │ └── chat/
│ │ └── route.ts # Vercel AI SDK ka backend route (Streaming response ke liye)
│ ├── globals.css # Tailwind/Shadcn ki global styles
│ ├── layout.tsx # Main layout file
│ └── page.tsx # Main chat page (Yahan aapka chatbot render hoga)
│
├── components/
│ ├── ui/ # Yahan Shadcn UI ke auto-generated components aayenge (button, input, etc.)
│ ├── chat/ # Chatbot se related custom components
│ │ ├── chat-interface.tsx # Pura chat layout (messages + input ko combine karega)
│ │ ├── chat-message.tsx # Single message bubble (AI aur User messages ke UI ke liye)
│ │ ├── chat-input.tsx # Message type karne wala textarea aur send button
│ │ └── chat-list.tsx # Sabhi messages ki list dikhane ke liye
│ └── shared/ # Header, Sidebar, ya Footer jaise common components
│
├── lib/
│ ├── utils.ts # Shadcn ka utility function (e.g., `cn` function jo classes merge karta hai)
│ └── ai/ # System prompts, tools, ya custom AI logic agar kuch ho toh
│
├── hooks/
│ └── use-chat-scroll.ts # (Optional) Auto-scroll to bottom ke liye custom hook
│
├── public/ # Images, icons aur dusre static assets
├── tailwind.config.ts # Tailwind configuration (Shadcn ke according setup)
├── components.json # Shadcn UI ki configuration file
├── tsconfig.json # TypeScript settings
└── package.json # Project dependencies
