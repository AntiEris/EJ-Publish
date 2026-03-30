import React from 'react';

interface PreviewPanelProps {
    renderedHtml: string;
    previewWidth: number;
    previewRef: React.RefObject<HTMLDivElement>;
    previewScrollRef: React.RefObject<HTMLDivElement>;
    onPreviewScroll: () => void;
    scrollSyncEnabled: boolean;
}

export default function PreviewPanel({
    renderedHtml,
    previewWidth,
    previewRef,
    previewScrollRef,
    onPreviewScroll,
    scrollSyncEnabled,
}: PreviewPanelProps) {
    return (
        <div
            ref={previewScrollRef}
            data-testid="preview-outer-scroll"
            onScroll={scrollSyncEnabled ? onPreviewScroll : undefined}
            className="relative h-full overflow-y-auto overscroll-contain no-scrollbar flex flex-col z-20 flex-1 min-h-0 w-full overflow-x-hidden"
            style={{ backgroundColor: '#E8E5DE' }}
        >
            <div className="flex justify-center px-5 py-9 min-h-full">
                <div
                    className="bg-white border border-rule shadow-page w-full h-fit"
                    style={{
                        maxWidth: `${previewWidth}px`,
                        transition: 'max-width 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    <div
                        ref={previewRef}
                        data-testid="preview-content"
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                        className="preview-content min-w-full"
                    />
                </div>
            </div>
        </div>
    );
}
