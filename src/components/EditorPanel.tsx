import React from 'react';
import { Wand2 } from 'lucide-react';
import { handleSmartPaste } from '../lib/htmlToMarkdown';

interface EditorPanelProps {
    markdownInput: string;
    onInputChange: (value: string) => void;
    editorScrollRef: React.RefObject<HTMLTextAreaElement>;
    onEditorScroll: () => void;
    scrollSyncEnabled: boolean;
}

export default function EditorPanel({ markdownInput, onInputChange, editorScrollRef, onEditorScroll, scrollSyncEnabled }: EditorPanelProps) {
    const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        handleSmartPaste(e, onInputChange);
    };

    return (
        <div className="flex flex-col relative z-30 bg-transparent flex-1 min-h-0">
            <textarea
                ref={editorScrollRef}
                data-testid="editor-input"
                className="w-full flex-1 px-[18px] py-5 resize-none bg-surface-editor outline-none font-mono text-[14px] leading-[1.85] no-scrollbar text-ink placeholder-ink-ghost"
                value={markdownInput}
                onChange={(e) => onInputChange(e.target.value)}
                onPaste={onPaste}
                onScroll={scrollSyncEnabled ? onEditorScroll : undefined}
                placeholder="在这里输入 Markdown 内容..."
                spellCheck={false}
            />

            <div className="shrink-0 flex items-center px-[14px] py-[6px] border-t border-rule-light bg-surface">
                <span className="flex items-center gap-[5px] text-[11px] text-ink-ghost">
                    <Wand2 size={12} className="shrink-0" />
                    智能粘贴：从飞书 / Notion / Word 粘贴自动转换
                </span>
            </div>
        </div>
    );
}
