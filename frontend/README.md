frontend/
├── app/
│ ├── api/
│ │ └── chat/
│ │ └── route.ts # Vercel AI SDK backend route (For streaming responses)
│ ├── globals.css # Tailwind/Shadcn global styles
│ ├── layout.tsx # Main layout file
│ └── page.tsx # Main chat page (The chatbot will render here)
│
├── components/
│ ├── ui/ # Auto-generated Shadcn UI components will go here (button, input, etc.)
│ ├── chat/ # Custom components related to the chatbot
│ │ ├── chat-interface.tsx # Full chat layout (combines messages + input)
│ │ ├── chat-message.tsx # Single message bubble (UI for AI and User messages)
│ │ ├── chat-input.tsx # Textarea for typing messages and the send button
│ │ └── chat-list.tsx # To display the list of all messages
│ └── shared/ # Common components like Header, Sidebar, or Footer
│
├── lib/
│ ├── utils.ts # Shadcn utility function (e.g., `cn` function that merges classes)
│ └── ai/ # System prompts, tools, or any custom AI logic
│
├── hooks/
│ └── use-chat-scroll.ts # (Optional) Custom hook for auto-scrolling to the bottom
│
├── public/ # Images, icons, and other static assets
├── tailwind.config.ts # Tailwind configuration (Setup according to Shadcn)
├── components.json # Shadcn UI configuration file
├── tsconfig.json # TypeScript settings
└── package.json # Project dependencies
