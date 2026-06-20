"use client";

import { useEffect, useRef } from "react";

export function useChatScroll(deps: unknown) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.scrollTop = ref.current.scrollHeight;
        }
    }, [deps]);

    return ref;
}
