import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { TemplateDefinition, TemplateGroup } from '../lib/templates';

interface ThemeSelectorProps {
  activeTheme: string;
  templates: TemplateDefinition[];
  groups: TemplateGroup[];
  onThemeChange: (themeId: string) => void;
}

function extractStyle(styleStr: string, prop: string): string | null {
  const regex = new RegExp(`${prop}\\s*:\\s*([^;!]+)`, 'i');
  const match = styleStr.match(regex);
  return match ? match[1].trim() : null;
}

function ThemeSwatch({
  selectorStyles,
}: {
  selectorStyles: Record<string, Record<string, string>>;
}) {
  const toStyleString = (style: Record<string, string> | undefined) =>
    Object.entries(style || {})
      .map(([property, value]) => `${property}: ${value};`)
      .join(' ');

  const containerStyle = toStyleString(selectorStyles.container);
  const paragraphStyle = toStyleString(selectorStyles.p);
  const h1Style = toStyleString(selectorStyles.h1);
  const accentStyle = toStyleString(selectorStyles.a || selectorStyles.blockquote);

  const bg = extractStyle(containerStyle, 'background-color') || '#ffffff';
  const textColor = extractStyle(paragraphStyle, 'color') || '#333333';
  const headingColor = extractStyle(h1Style, 'color') || textColor;
  const accentColor = extractStyle(accentStyle, 'color') || headingColor;

  return (
    <div
      className="flex h-[10px] gap-0.5 overflow-hidden rounded-sm border border-ink-ghost"
      style={{ width: '40px' }}
    >
      <div className="flex-1" style={{ backgroundColor: bg }} />
      <div className="flex-1" style={{ backgroundColor: headingColor }} />
      <div className="flex-1" style={{ backgroundColor: accentColor }} />
      <div className="flex-1" style={{ backgroundColor: textColor }} />
    </div>
  );
}

export default function ThemeSelector({
  activeTheme,
  templates,
  groups,
  onThemeChange,
}: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(true);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowBottomFade(scrollHeight - scrollTop - clientHeight > 20);
  };

  useEffect(() => {
    if (isOpen) {
      if (scrollRef.current) handleScroll();
      if (moreButtonRef.current) {
        const rect = moreButtonRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 4,
          left: Math.max(8, rect.left),
        });
      }
    }
  }, [isOpen]);

  const quickTemplates = useMemo(() => {
    const shuffled = [...templates];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled.slice(0, Math.min(4, shuffled.length));
  }, [templates]);

  return (
    <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
      <div className="pill-group shrink-0">
        {quickTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onThemeChange(template.id)}
            className={`flex items-center gap-[5px] px-[9px] py-[3px] rounded-[4px] text-[11.5px] font-medium whitespace-nowrap transition-all cursor-pointer border-none ${
              activeTheme === template.id
                ? 'bg-surface text-ink shadow-sm'
                : 'bg-transparent text-ink-muted'
            }`}
          >
            <ThemeSwatch selectorStyles={template.selectorStyles} />
            {template.name.split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="shrink-0">
        <button
          ref={moreButtonRef}
          onClick={() => setIsOpen((open) => !open)}
          className="px-[6px] py-[3px] border-none bg-transparent cursor-pointer text-ink-faint text-[11.5px] rounded-[4px] transition-all hover:text-ink-muted"
        >
          更多 ›
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/10"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="fixed z-50 overflow-hidden rounded-xl border border-rule bg-surface shadow-md w-[520px] md:w-[620px]"
                style={{
                  maxHeight: 'min(70vh, 600px)',
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                }}
              >
                <div className="flex items-center justify-between px-4 pb-2 pt-3">
                  <span className="text-[14px] font-semibold text-ink">
                    选择模板 · {templates.length} 套
                  </span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-md p-1 transition-colors hover:bg-surface-dim"
                  >
                    <X size={14} className="text-ink-faint" />
                  </button>
                </div>

                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="overflow-y-auto px-4 pb-4"
                  style={{ maxHeight: 'min(calc(70vh - 56px), 544px)' }}
                >
                  {groups.map((group, groupIndex) => (
                    <div key={group.label}>
                      <div
                        className={`flex items-center gap-2 ${
                          groupIndex > 0
                            ? 'mt-3 border-t border-rule-light pt-3'
                            : 'mt-1'
                        }`}
                      >
                        <span className="text-[10.5px] font-semibold uppercase tracking-widest text-ink-faint">
                          {group.label}
                        </span>
                        <span className="text-[10px] text-ink-ghost">
                          {group.templates.length} 套
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {group.templates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => {
                              onThemeChange(template.id);
                              setIsOpen(false);
                            }}
                            className={`relative flex flex-col items-start gap-1.5 rounded-lg p-3 text-left transition-all ${
                              activeTheme === template.id
                                ? 'bg-rule-faint ring-1 ring-ink-muted'
                                : 'bg-surface-dim hover:bg-rule-faint'
                            }`}
                          >
                            <div className="flex w-full items-center justify-between">
                              <ThemeSwatch selectorStyles={template.selectorStyles} />
                              {activeTheme === template.id && (
                                <Check size={12} className="text-ink-soft" />
                              )}
                            </div>
                            <span className="leading-tight text-[12.5px] font-semibold text-ink">
                              {template.name}
                            </span>
                            <span className="line-clamp-2 text-[11px] leading-snug text-ink-muted">
                              {template.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className={`pointer-events-none absolute bottom-0 left-0 right-0 h-10 rounded-b-xl bg-gradient-to-t from-surface to-transparent transition-opacity duration-200 ${
                    showBottomFade ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
