import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, PenLine, RotateCcw } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import EditorPanel from '../components/EditorPanel';
import PreviewPanel from '../components/PreviewPanel';
import ThemeSelector from '../components/ThemeSelector';
import Toolbar from '../components/Toolbar';
import { useEditor } from '../lib/editorContext';
import { useTemplateLibrary } from '../lib/templates/context';
import { resolveImageRefs } from '../lib/imageStore';
import { applyTheme, md, preprocessMarkdown } from '../lib/markdown';
import { makeWeChatCompatible } from '../lib/wechatCompat';

export default function EditorPage() {
    const {
        templates,
        templateGroups,
        activeTemplate,
        activeTemplateId,
        setActiveTemplateId,
    } = useTemplateLibrary();
    const { markdownInput, setMarkdownInput, resetToDefault } = useEditor();
    const [renderedHtml, setRenderedHtml] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [previewWidth, setPreviewWidth] = useState(1024);
    const [activePanel, setActivePanel] = useState<'editor' | 'preview'>('editor');
    const [scrollSyncEnabled, setScrollSyncEnabled] = useState(true);
    const previewRef = useRef<HTMLDivElement>(null);
    const editorScrollRef = useRef<HTMLTextAreaElement>(null);
    const previewScrollRef = useRef<HTMLDivElement>(null);
    const scrollSyncLockRef = useRef<'editor' | 'preview' | null>(null);
    const scrollLockReleaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Draggable divider state
    const workspaceRef = useRef<HTMLDivElement>(null);
    const editorSideRef = useRef<HTMLDivElement>(null);
    const [editorWidthPx, setEditorWidthPx] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ x: number; width: number } | null>(null);

    useEffect(() => {
        const resolved = resolveImageRefs(preprocessMarkdown(markdownInput));
        const rawHtml = md.render(resolved);
        const styledHtml = applyTheme(rawHtml, activeTemplate);
        setRenderedHtml(styledHtml);
    }, [markdownInput, activeTemplate]);

    useEffect(() => {
        if (!scrollSyncEnabled) {
            scrollSyncLockRef.current = null;
            if (scrollLockReleaseTimeoutRef.current) {
                clearTimeout(scrollLockReleaseTimeoutRef.current);
                scrollLockReleaseTimeoutRef.current = null;
            }
        }
    }, [scrollSyncEnabled]);

    useEffect(() => () => {
        if (scrollLockReleaseTimeoutRef.current) {
            clearTimeout(scrollLockReleaseTimeoutRef.current);
        }
    }, []);

    const syncScrollPosition = (
        sourceElement: HTMLElement,
        targetElement: HTMLElement,
        sourcePanel: 'editor' | 'preview'
    ) => {
        if (!scrollSyncEnabled) return;
        if (scrollSyncLockRef.current && scrollSyncLockRef.current !== sourcePanel) return;

        const sourceMaxScroll = sourceElement.scrollHeight - sourceElement.clientHeight;
        const targetMaxScroll = targetElement.scrollHeight - targetElement.clientHeight;
        if (sourceMaxScroll <= 0) {
            targetElement.scrollTop = 0;
            return;
        }

        const scrollRatio = sourceElement.scrollTop / sourceMaxScroll;
        scrollSyncLockRef.current = sourcePanel;
        targetElement.scrollTop = scrollRatio * Math.max(targetMaxScroll, 0);

        if (scrollLockReleaseTimeoutRef.current) {
            clearTimeout(scrollLockReleaseTimeoutRef.current);
        }

        scrollLockReleaseTimeoutRef.current = setTimeout(() => {
            if (scrollSyncLockRef.current === sourcePanel) {
                scrollSyncLockRef.current = null;
            }
            scrollLockReleaseTimeoutRef.current = null;
        }, 50);
    };

    const handleEditorScroll = () => {
        const editorElement = editorScrollRef.current;
        const previewElement = previewScrollRef.current;
        if (!editorElement || !previewElement) return;
        syncScrollPosition(editorElement, previewElement, 'editor');
    };

    const handlePreviewScroll = () => {
        const previewElement = previewScrollRef.current;
        const editorElement = editorScrollRef.current;
        if (!previewElement || !editorElement) return;
        syncScrollPosition(previewElement, editorElement, 'preview');
    };

    const handleCopy = async () => {
        if (!previewRef.current) return;
        setIsCopying(true);
        try {
            const finalHtmlForCopy = await makeWeChatCompatible(renderedHtml, activeTemplate);

            const blob = new Blob([finalHtmlForCopy], { type: 'text/html' });
            const textBlob = new Blob([previewRef.current.innerText], { type: 'text/plain' });

            const clipboardItem = new ClipboardItem({
                'text/html': blob,
                'text/plain': textBlob,
            });
            await navigator.clipboard.write([clipboardItem]);

            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Copy failed', error);
            alert('复制失败，请检查浏览器剪贴板权限。');
        } finally {
            setIsCopying(false);
        }
    };

    const handleExportHtml = async () => {
        // Convert relative/local images to base64 for self-contained HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(renderedHtml, 'text/html');
        const imgs = Array.from(doc.querySelectorAll('img'));
        await Promise.all(imgs.map(async (img) => {
            const src = img.getAttribute('src');
            if (!src || src.startsWith('data:')) return;
            try {
                const resp = await fetch(src, { mode: 'cors' });
                if (!resp.ok) return;
                const blob = await resp.blob();
                const reader = new FileReader();
                const base64: string = await new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = () => resolve(src);
                    reader.readAsDataURL(blob);
                });
                img.setAttribute('src', base64);
            } catch { /* keep original src */ }
        }));
        const finalHtml = doc.body.innerHTML;
        const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${activeTemplate.name}_${new Date().getTime()}.html`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const handleExportPdf = () => {
        if (!previewRef.current) return;
        const element = previewRef.current;
        const opt = {
            margin: 10,
            filename: `${activeTemplate.name}_${new Date().getTime()}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                backgroundColor: '#ffffff',
            },
            jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const },
        };
        const clonedElement = element.cloneNode(true) as HTMLElement;
        const cloneContainer = document.createElement('div');
        cloneContainer.style.background = '#ffffff';
        cloneContainer.appendChild(clonedElement);

        document.body.appendChild(cloneContainer);
        html2pdf()
            .set(opt)
            .from(cloneContainer)
            .save()
            .then(() => {
                document.body.removeChild(cloneContainer);
            });
    };

    // ===== Drag divider handlers =====
    const handleDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const editorEl = editorSideRef.current;
        if (!editorEl) return;
        dragStartRef.current = { x: e.clientX, width: editorEl.offsetWidth };
        setIsDragging(true);
        document.body.classList.add('drag-no-select');
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const start = dragStartRef.current;
            const ws = workspaceRef.current;
            if (!start || !ws) return;
            const maxW = ws.offsetWidth - 480;
            const newW = Math.min(maxW, Math.max(280, start.width + e.clientX - start.x));
            setEditorWidthPx(newW);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            dragStartRef.current = null;
            document.body.classList.remove('drag-no-select');
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    // Initialize editor width to 50% on first render
    useEffect(() => {
        if (editorWidthPx === null && workspaceRef.current) {
            setEditorWidthPx(Math.round(workspaceRef.current.offsetWidth * 0.5));
        }
    }, [editorWidthPx]);

    return (
        <>
            {/* Mobile tabs */}
            <div className="md:hidden panel-bar flex items-center z-[90]">
                <button
                    data-testid="tab-editor"
                    onClick={() => setActivePanel('editor')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-semibold transition-colors border-b-2 ${activePanel === 'editor' ? 'text-ink border-ink' : 'text-ink-faint border-transparent'}`}
                >
                    <PenLine size={15} />
                    编辑
                </button>
                <button
                    data-testid="tab-preview"
                    onClick={() => setActivePanel('preview')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-semibold transition-colors border-b-2 ${activePanel === 'preview' ? 'text-ink border-ink' : 'text-ink-faint border-transparent'}`}
                >
                    <Eye size={15} />
                    预览
                </button>
            </div>

            {/* Mobile theme + toolbar */}
            <div className="md:hidden panel-bar z-[90]">
                <div className="overflow-x-auto no-scrollbar border-b border-rule-light px-3 py-2">
                    <ThemeSelector
                        activeTheme={activeTemplateId}
                        templates={templates}
                        groups={templateGroups}
                        onThemeChange={setActiveTemplateId}
                    />
                </div>
                <Toolbar
                    previewWidth={previewWidth}
                    onWidthChange={setPreviewWidth}
                    onExportPdf={handleExportPdf}
                    onExportHtml={handleExportHtml}
                    onCopy={handleCopy}
                    copied={copied}
                    isCopying={isCopying}
                    scrollSyncEnabled={scrollSyncEnabled}
                    onToggleScrollSync={() => setScrollSyncEnabled((prev) => !prev)}
                />
            </div>

            {/* Main workspace */}
            <main ref={workspaceRef} className="flex-1 overflow-hidden flex relative">
                {/* Left: editor side */}
                <div
                    ref={editorSideRef}
                    className={`${activePanel === 'editor' ? 'flex' : 'hidden'} md:flex flex-col overflow-hidden bg-surface border-r border-rule shrink-0`}
                    style={{ width: editorWidthPx != null ? `${editorWidthPx}px` : '50%', minWidth: 280 }}
                >
                    {/* Editor topbar: theme pills + char count */}
                    <div className="hidden md:flex items-center justify-between h-10 px-[14px] border-b border-rule-light shrink-0 gap-2">
                        <ThemeSelector
                            activeTheme={activeTemplateId}
                            templates={templates}
                            groups={templateGroups}
                            onThemeChange={setActiveTemplateId}
                        />
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-ink-faint font-mono whitespace-nowrap">
                                {markdownInput.length} 字
                            </span>
                            <button
                                onClick={() => { if (window.confirm('确定要重置编辑器内容为默认示例吗？')) resetToDefault(); }}
                                className="text-ink-faint hover:text-ink transition-colors"
                                title="重置为默认示例"
                            >
                                <RotateCcw size={13} />
                            </button>
                        </div>
                    </div>
                    <EditorPanel
                        markdownInput={markdownInput}
                        onInputChange={setMarkdownInput}
                        editorScrollRef={editorScrollRef}
                        onEditorScroll={handleEditorScroll}
                        scrollSyncEnabled={scrollSyncEnabled}
                    />
                </div>

                {/* Drag handle */}
                <div
                    className={`drag-handle hidden md:block ${isDragging ? 'drag-handle-active' : ''}`}
                    onMouseDown={handleDragStart}
                />

                {/* Right: preview side */}
                <div className={`${activePanel === 'preview' ? 'flex' : 'hidden'} md:flex flex-col overflow-hidden flex-1 min-w-[480px] bg-paper`}>
                    {/* Preview topbar: width control + export */}
                    <div className="hidden md:block">
                        <Toolbar
                            previewWidth={previewWidth}
                            onWidthChange={setPreviewWidth}
                            onExportPdf={handleExportPdf}
                            onExportHtml={handleExportHtml}
                            onCopy={handleCopy}
                            copied={copied}
                            isCopying={isCopying}
                            scrollSyncEnabled={scrollSyncEnabled}
                            onToggleScrollSync={() => setScrollSyncEnabled((prev) => !prev)}
                        />
                    </div>
                    <PreviewPanel
                        renderedHtml={renderedHtml}
                        previewWidth={previewWidth}
                        previewRef={previewRef}
                        previewScrollRef={previewScrollRef}
                        onPreviewScroll={handlePreviewScroll}
                        scrollSyncEnabled={scrollSyncEnabled}
                    />
                </div>
            </main>
        </>
    );
}
