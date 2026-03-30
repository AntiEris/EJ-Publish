import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { defaultContent } from '../defaultContent';
import { clearStore as clearImageStore } from './imageStore';

const STORAGE_KEY = 'sns-publish:editor-content';

interface EditorContextValue {
    markdownInput: string;
    setMarkdownInput: (value: string) => void;
    resetToDefault: () => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

function loadSavedContent(): string {
    try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        return saved ?? defaultContent;
    } catch {
        return defaultContent;
    }
}

export function EditorProvider({ children }: { children: ReactNode }) {
    const [markdownInput, setMarkdownInput] = useState(loadSavedContent);
    const latestRef = useRef(markdownInput);

    // Keep ref in sync for the beforeunload handler
    latestRef.current = markdownInput;

    // Persist to sessionStorage on changes (debounced to avoid thrashing)
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                sessionStorage.setItem(STORAGE_KEY, markdownInput);
            } catch { /* storage full — ignore */ }
        }, 300);
        return () => clearTimeout(timer);
    }, [markdownInput]);

    const resetToDefault = useCallback(() => {
        setMarkdownInput(defaultContent);
        try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
        clearImageStore();
    }, []);

    return (
        <EditorContext.Provider value={{ markdownInput, setMarkdownInput, resetToDefault }}>
            {children}
        </EditorContext.Provider>
    );
}

export function useEditor(): EditorContextValue {
    const ctx = useContext(EditorContext);
    if (!ctx) throw new Error('useEditor must be used within EditorProvider');
    return ctx;
}
