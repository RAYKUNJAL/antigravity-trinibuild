/// <reference types="vite/client" />

interface WindowEventMap {
    'open-chat': CustomEvent<{ mode: string }>;
}

