import { Copy, CheckCircle2, Download, Loader2, Link2, Unlink2 } from 'lucide-react';
import { motion } from 'framer-motion';

const WIDTH_PRESETS = [375, 520, 680, 840, 1024];

interface ToolbarProps {
    previewWidth: number;
    onWidthChange: (width: number) => void;
    onExportPdf: () => void;
    onExportHtml: () => void;
    onCopy: () => void;
    copied: boolean;
    isCopying: boolean;
    scrollSyncEnabled: boolean;
    onToggleScrollSync: () => void;
}

export default function Toolbar({
    previewWidth,
    onWidthChange,
    onExportPdf,
    onExportHtml,
    onCopy,
    copied,
    isCopying,
    scrollSyncEnabled,
    onToggleScrollSync,
}: ToolbarProps) {
    return (
        <div className="flex items-center justify-between h-10 px-[14px] bg-surface border-b border-rule-light shrink-0 gap-[10px]">
            {/* Left: width control */}
            <div className="flex items-center gap-2 flex-1">
                <div className="width-preset-group">
                    {WIDTH_PRESETS.map((w) => (
                        <button
                            key={w}
                            onClick={() => onWidthChange(w)}
                            className={`width-preset-btn ${previewWidth === w ? 'width-preset-btn-active' : ''}`}
                        >
                            {w}
                        </button>
                    ))}
                </div>
                <input
                    type="range"
                    className="width-slider"
                    min={320}
                    max={1200}
                    value={previewWidth}
                    onChange={(e) => onWidthChange(Number(e.target.value))}
                />
                <span className="text-[10.5px] font-medium text-ink-faint font-mono min-w-[36px]">
                    {previewWidth}px
                </span>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1 shrink-0">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    data-testid="scroll-sync-toggle"
                    onClick={onToggleScrollSync}
                    className={`icon-btn-sm ${scrollSyncEnabled ? 'icon-btn-sm-active' : ''}`}
                    title={scrollSyncEnabled ? '关闭滚动同步' : '开启滚动同步'}
                >
                    {scrollSyncEnabled ? <Link2 size={14} /> : <Unlink2 size={14} />}
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    data-testid="export-pdf"
                    onClick={onExportPdf}
                    className="ink-btn-outline hidden sm:flex"
                >
                    <Download size={12} />
                    PDF
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    data-testid="export-html"
                    onClick={onExportHtml}
                    className="ink-btn-outline hidden lg:flex"
                >
                    <Download size={12} />
                    HTML
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    data-testid="copy-button"
                    onClick={onCopy}
                    disabled={isCopying}
                    className={
                        copied
                            ? 'ink-btn-success'
                            : isCopying
                              ? 'ink-btn-dark opacity-80 cursor-not-allowed'
                              : 'ink-btn-dark'
                    }
                >
                    {copied ? (
                        <CheckCircle2 size={12} />
                    ) : isCopying ? (
                        <Loader2 className="animate-spin" size={12} />
                    ) : (
                        <Copy size={12} />
                    )}
                    <span className="hidden sm:inline">
                        {copied ? '已复制' : isCopying ? '打包中...' : '复制到微信'}
                    </span>
                    <span className="sm:hidden">
                        {copied ? '已复制' : isCopying ? '...' : '复制'}
                    </span>
                </motion.button>
            </div>
        </div>
    );
}
