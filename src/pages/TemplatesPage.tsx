import { useEffect, useMemo, useRef, useState, type ReactNode, type WheelEvent as ReactWheelEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  CircleHelp,
  CopyPlus,
  Download,
  FileDown,
  FileUp,
  ImageUp,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import {
  FONT_FAMILY_OPTIONS,
  BLOCKQUOTE_PRESETS,
  HEADING_PRESETS,
  HR_PRESETS,
  IMG_PRESETS,
  PRE_PRESETS,
  TEMPLATE_STYLE_CATALOG,
  type StyleFieldSpec,
} from '../lib/templates/styleCatalog';
import { applyTheme, md, preprocessMarkdown } from '../lib/markdown';
import {
  cloneStyleDeclaration,
  cloneTemplate,
  deriveGlobalStyles,
  ensureUniqueTemplateId,
  sanitizeTemplateId,
} from '../lib/templates/styleUtils';
import type { StyleDeclaration, TemplateDefinition, TemplatePack, TemplateSelector } from '../lib/templates';
import { fullPreviewMarkdown, selectorPreviewMarkdown } from '../lib/templates/sampleMarkdown';
import { useTemplateLibrary } from '../lib/templates/context';
import PreviewPanel from '../components/PreviewPanel';

type ImportMode = 'single' | 'pack';
type PreviewMode = 'block' | 'page';
type TemplateMetaForm = {
  name: string;
  id: string;
  description: string;
};
const SECTIONS = ['Typography', 'Color / Background', 'Spacing', 'Border / Radius', 'Effects'] as const;

const IMPORTANT_RE = /\s*!important\s*/gi;

function stripImportant(value: string) {
  return value.replace(IMPORTANT_RE, '').trim();
}

function restoreImportant(original: string, nextValue: string) {
  return original.includes('!important') ? `${nextValue} !important` : nextValue;
}

function toLines(style?: StyleDeclaration) {
  return Object.entries(style || {})
    .map(([property, value]) => `${property}: ${stripImportant(value)};`)
    .join('\n');
}

function toStyle(input: string) {
  return Object.fromEntries(
    input
      .split('\n')
      .map((line) => line.trim().replace(/;$/, ''))
      .filter(Boolean)
      .map((line) => {
        const index = line.indexOf(':');
        return index === -1 ? ['', ''] : [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
      .filter(([property, value]) => property && value)
  ) as StyleDeclaration;
}

function downloadJson(name: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function isPack(value: unknown): value is TemplatePack {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'templates' in (value as Record<string, unknown>) &&
      Array.isArray((value as TemplatePack).templates)
  );
}

function parseBoxValues(value: string) {
  const tokens = stripImportant(value).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return ['', '', '', ''];
  if (tokens.length === 1) return [tokens[0], tokens[0], tokens[0], tokens[0]];
  if (tokens.length === 2) return [tokens[0], tokens[1], tokens[0], tokens[1]];
  if (tokens.length === 3) return [tokens[0], tokens[1], tokens[2], tokens[1]];
  return [tokens[0], tokens[1], tokens[2], tokens[3]];
}

function stringifyBoxValues(values: string[]) {
  const normalized = values.map((value) => value.trim() || '0');
  return normalized.join(' ');
}

function parseNumericValue(value: string, fallback: number) {
  const cleaned = stripImportant(value);
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : fallback;
}

function formatNumericValue(value: number, unit = 'px') {
  return unit ? `${value}${unit}` : `${value}`;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(normalized)) {
    return { r: 0, g: 0, b: 0 };
  }

  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized;

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0'))
    .join('')}`;
}

function parseColorControl(value: string) {
  const normalized = stripImportant(value);
  const rgbaMatch = normalized.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d*\.?\d+))?\s*\)$/i
  );

  if (rgbaMatch) {
    const [, r, g, b, alpha] = rgbaMatch;
    return {
      hex: rgbToHex(Number(r), Number(g), Number(b)),
      alpha: alpha ? Math.round(Number(alpha) * 100) : 100,
      isRgba: Boolean(alpha),
    };
  }

  const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const { r, g, b } = hexToRgb(normalized);
    return {
      hex: rgbToHex(r, g, b),
      alpha: 100,
      isRgba: false,
    };
  }

  return {
    hex: '#000000',
    alpha: 100,
    isRgba: false,
  };
}

function stringifyColorControl(hex: string, alpha: number, preferRgba = false) {
  const safeAlpha = Math.max(0, Math.min(100, alpha));
  if (safeAlpha >= 100 && !preferRgba) return hex;

  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${(safeAlpha / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')})`;
}

const ADVANCED_PRESETS = [
  {
    label: '轻微阴影',
    snippet: 'box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);',
  },
  {
    label: '细边框',
    snippet: 'border: 1px solid rgba(15, 23, 42, 0.10);',
  },
  {
    label: '柔和高亮',
    snippet: 'background-color: rgba(250, 204, 21, 0.16);',
  },
  {
    label: '轻圆角卡片',
    snippet: 'border-radius: 14px;\nbox-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);',
  },
];

function parseBorderSegments(value: string) {
  const cleaned = stripImportant(value).trim();
  if (!cleaned) return { width: '4px', style: 'solid', color: '#000000' };

  const colorMatch = cleaned.match(
    /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|transparent|currentColor|[a-zA-Z]+)\s*$/
  );
  const color = colorMatch?.[1] || '#000000';
  const withoutColor = colorMatch ? cleaned.slice(0, colorMatch.index).trim() : cleaned;
  const styleMatch = withoutColor.match(/\b(solid|dashed|dotted|double|none)\b/);
  const style = styleMatch?.[1] || 'solid';
  const width = withoutColor.replace(/\b(solid|dashed|dotted|double|none)\b/, '').trim() || '4px';

  return { width, style, color };
}

function replaceBorderColor(value: string, nextColor: string) {
  const border = parseBorderSegments(value);
  return `${border.width} ${border.style} ${nextColor}`.trim();
}

function updateStyleProperty(style: StyleDeclaration, property: string, value: string) {
  if (value.trim()) {
    style[property] = value;
  } else {
    delete style[property];
  }
}

function readFieldValue(template: TemplateDefinition, selector: TemplateSelector, field: StyleFieldSpec) {
  if (field.valueMode === 'multi-target' && field.targets?.length) {
    const target = field.targets[0];
    return stripImportant(template.selectorStyles[target.selector]?.[target.property] || '');
  }

  const currentValue =
    template.selectorStyles[selector]?.[field.property === 'text-decoration' ? 'text-decoration-line' : field.property] ||
    template.selectorStyles[selector]?.[field.property] ||
    '';
  if (field.valueMode === 'border-color') {
    return parseBorderSegments(currentValue).color;
  }

  return stripImportant(currentValue);
}

function applyFieldValue(
  template: TemplateDefinition,
  selector: TemplateSelector,
  field: StyleFieldSpec,
  nextValue: string
) {
  const nextTemplate = cloneTemplate(template);

  if (field.valueMode === 'multi-target' && field.targets) {
    // Read the current global value before the change
    const oldGlobalValue = readFieldValue(template, selector, field);
    field.targets.forEach((target) => {
      const currentTargetValue = stripImportant(
        template.selectorStyles[target.selector]?.[target.property] || ''
      );
      // Only update targets that are still tracking the global value;
      // skip targets that have been independently customized
      if (!currentTargetValue || currentTargetValue === oldGlobalValue) {
        const nextStyle = cloneStyleDeclaration(nextTemplate.selectorStyles[target.selector]);
        updateStyleProperty(nextStyle, target.property, nextValue);
        nextTemplate.selectorStyles[target.selector] = nextStyle;
      }
    });
  } else if (field.valueMode === 'border-color') {
    const nextStyle = cloneStyleDeclaration(nextTemplate.selectorStyles[selector]);
    const current = nextStyle[field.property] || '';
    updateStyleProperty(nextStyle, field.property, nextValue ? replaceBorderColor(current, nextValue) : '');
    nextTemplate.selectorStyles[selector] = nextStyle;
  } else {
    const nextStyle = cloneStyleDeclaration(nextTemplate.selectorStyles[selector]);
    const original = nextStyle[field.property] || '';
    updateStyleProperty(nextStyle, field.property, restoreImportant(original, nextValue));

    if (
      selector === 'a' &&
      ['text-decoration', 'text-decoration-style', 'text-decoration-color', 'text-underline-offset'].includes(field.property)
    ) {
      if (field.property === 'text-decoration') {
        updateStyleProperty(nextStyle, 'text-decoration-line', nextValue);
        delete nextStyle['text-decoration'];
      } else if (nextValue.trim()) {
        nextStyle['text-decoration-line'] = nextStyle['text-decoration-line'] || 'underline';
      }

      if (
        nextStyle['text-decoration-line'] &&
        nextStyle['text-decoration-line'] !== 'none' &&
        nextStyle['text-decoration-line'] !== ''
      ) {
        delete nextStyle['border-bottom'];
      }
    }

    if (selector === 'u') {
      nextStyle['text-decoration-line'] = 'underline';
      delete nextStyle['text-decoration'];
    }

    nextTemplate.selectorStyles[selector] = nextStyle;
  }

  nextTemplate.globalStyles = deriveGlobalStyles(nextTemplate.selectorStyles);
  nextTemplate.meta.updatedAt = new Date().toISOString();
  return nextTemplate;
}

function HelpBlock({ helperText, example }: { helperText?: string; example?: string }) {
  if (!helperText && !example) return null;

  return (
    <div className="mt-2 rounded-lg bg-surface-dim px-3 py-2 text-[12px] leading-5 text-ink-muted">
      {helperText && <p>{helperText}</p>}
      {example && <p>示例：{example}</p>}
    </div>
  );
}

function LabelRow({ label, helperText, example }: { label: string; helperText?: string; example?: string }) {
  const tip = [helperText, example ? `示例：${example}` : ''].filter(Boolean).join('\n');

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">{label}</span>
      {(helperText || example) && (
        <span title={tip} className="inline-flex text-ink-faint">
          <CircleHelp size={14} />
        </span>
      )}
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled,
  primary = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  const base = 'inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-medium rounded-[5px] border cursor-pointer transition-all whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-default';
  const variant = primary
    ? `${base} bg-btn-fill text-btn-text border-btn-fill hover:bg-btn-fill-hover`
    : `${base} bg-surface text-ink-muted border-rule hover:bg-rule-faint hover:border-ink-ghost`;
  return (
    <button onClick={onClick} disabled={disabled} className={variant}>
      {icon}
      {label}
    </button>
  );
}

function StyleField({
  field,
  value,
  onChange,
  onUploadImage,
}: {
  field: StyleFieldSpec;
  value: string;
  onChange: (value: string) => void;
  onUploadImage?: () => void;
}) {
  const normalizedValue = stripImportant(value);
  const numericValue = parseNumericValue(normalizedValue, field.min || 0);
  const boxValues = parseBoxValues(normalizedValue);
  const colorControl = parseColorControl(normalizedValue);

  const renderStepper = (nextValue: number, formatter: (value: number) => string) => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="rounded-xl border border-rule-light px-2 py-2"
        onClick={() => onChange(formatter(nextValue - (field.step || 1)))}
      >
        <Minus size={14} />
      </button>
      <input
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        className="flex-1 accent-black"
        value={nextValue}
        onChange={(event) => onChange(formatter(Number(event.target.value)))}
      />
      <button
        type="button"
        className="rounded-xl border border-rule-light px-2 py-2"
        onClick={() => onChange(formatter(nextValue + (field.step || 1)))}
      >
        <Plus size={14} />
      </button>
      <div className="min-w-[68px] rounded-lg border border-rule-light bg-surface px-3 py-2 text-center">
        {field.unit ? formatNumericValue(nextValue, field.unit) : `${nextValue}`}
      </div>
    </div>
  );

  return (
    <label className="flex flex-col gap-2 text-[13px] text-ink">
      <LabelRow label={field.label} helperText={field.helperText} example={field.example} />
      {field.input === 'textarea' ? (
        <textarea
          className="min-h-[120px] rounded-lg border border-rule-light bg-surface px-3 py-2 text-[13px] outline-none"
          value={normalizedValue}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
        />
      ) : null}
      {field.input === 'select' ? (
        <select
          className="rounded-lg border border-rule-light bg-surface px-3 py-2 text-[13px] outline-none"
          value={normalizedValue}
          onChange={(event) => onChange(event.target.value)}
        >
          {!field.options?.includes('') ? <option value="">默认</option> : null}
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option || '默认'}
            </option>
          ))}
        </select>
      ) : null}
      {field.input === 'font-family' ? (
        <select
          className="rounded-lg border border-rule-light bg-surface px-3 py-2 text-[13px] outline-none"
          value={normalizedValue}
          onChange={(event) => onChange(event.target.value)}
        >
          {FONT_FAMILY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
      {field.input === 'color' ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-10 w-12 rounded-xl border border-rule-light bg-transparent p-1"
              value={colorControl.hex}
              onChange={(event) =>
                onChange(stringifyColorControl(event.target.value, colorControl.alpha, colorControl.isRgba || colorControl.alpha < 100))
              }
            />
            <input
              className="flex-1 rounded-lg border border-rule-light bg-surface px-3 py-2 text-[13px] outline-none"
              value={normalizedValue}
              onChange={(event) => onChange(event.target.value)}
              placeholder={field.placeholder || '#333333 / rgba(255, 215, 0, 0.25)'}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="min-w-[56px] text-[12px] text-ink-muted">透明度</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              className="flex-1 accent-black"
              value={colorControl.alpha}
              onChange={(event) =>
                onChange(stringifyColorControl(colorControl.hex, Number(event.target.value), true))
              }
            />
            <div className="min-w-[58px] rounded-lg border border-rule-light bg-surface px-3 py-2 text-center text-[12px]">
              {colorControl.alpha}%
            </div>
          </div>
        </div>
      ) : null}
      {field.input === 'font-size'
        ? renderStepper(numericValue, (next) =>
            formatNumericValue(
              Math.min(field.max || next, Math.max(field.min || next, next)),
              field.unit || 'px'
            )
          )
        : null}
      {field.input === 'line-height'
        ? renderStepper(Number(numericValue.toFixed(2)), (next) =>
            `${Math.min(field.max || next, Math.max(field.min || next, Number(next.toFixed(2)))).toFixed(2)}`
          )
        : null}
      {field.input === 'length' ? (
        /%|auto/.test(normalizedValue)
          ? (
            <input
              className="rounded-lg border border-rule-light bg-surface px-3 py-2 text-[13px] outline-none"
              value={normalizedValue}
              onChange={(event) => onChange(event.target.value)}
              placeholder={field.placeholder}
            />
          )
          : renderStepper(numericValue, (next) =>
              formatNumericValue(
                Math.min(field.max || next, Math.max(field.min || next, next)),
                field.unit || 'px'
              )
            )
      ) : null}
      {field.input === 'spacing' ? (
        <div className="grid grid-cols-2 gap-2">
          {['上', '右', '下', '左'].map((label, index) => (
            <label key={label} className="flex flex-col gap-1">
              <span className="text-[11px] text-ink-faint">{label}</span>
              <input
                className="rounded-lg border border-rule-light bg-surface px-3 py-2 text-[13px] outline-none"
                value={boxValues[index]}
                onChange={(event) => {
                  const nextValues = [...boxValues];
                  nextValues[index] = event.target.value;
                  onChange(stringifyBoxValues(nextValues));
                }}
                placeholder="0"
              />
            </label>
          ))}
        </div>
      ) : null}
      {field.input === 'background-image' ? (
        <div className="space-y-2">
          <input
            className="w-full rounded-lg border border-rule-light bg-surface px-3 py-2 text-[13px] outline-none"
            value={normalizedValue}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
          />
          <button
            type="button"
            onClick={onUploadImage}
            className="ink-btn-outline !px-3 !py-2 !text-[12px]"
          >
            <ImageUp size={14} />
            上传背景图
          </button>
        </div>
      ) : null}
      {field.input === 'text' ? (
        <input
          className="rounded-lg border border-rule-light bg-surface px-3 py-2 text-[13px] outline-none"
          value={normalizedValue}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
        />
      ) : null}
      <HelpBlock helperText={field.helperText} example={field.example} />
    </label>
  );
}

export default function TemplatesPage() {
  const {
    templates,
    activeTemplateId,
    setActiveTemplateId,
    saveTemplate,
    deleteTemplate,
    restoreSeedTemplates,
    duplicateTemplate,
    createTemplate,
    canWriteTemplates,
  } = useTemplateLibrary();
  const navigate = useNavigate();
  const singleRef = useRef<HTMLInputElement>(null);
  const packRef = useRef<HTMLInputElement>(null);
  const templateLibraryScrollRef = useRef<HTMLDivElement>(null);
  const selectorEditorScrollRef = useRef<HTMLDivElement>(null);
  const previewContentRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<TemplateDefinition | null>(null);
  const [selector, setSelector] = useState<TemplateSelector>('container');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('page');
  const [status, setStatus] = useState('');
  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(false);
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const [metaForm, setMetaForm] = useState<TemplateMetaForm>({
    name: '',
    id: '',
    description: '',
  });

  const selected = useMemo(
    () => templates.find((template) => template.id === activeTemplateId) || templates[0] || null,
    [activeTemplateId, templates]
  );
  const catalog = useMemo(
    () => TEMPLATE_STYLE_CATALOG.find((item) => item.selector === selector),
    [selector]
  );
  const dirty = useMemo(
    () => Boolean(selected && draft && JSON.stringify(selected) !== JSON.stringify(draft)),
    [draft, selected]
  );
  const previewHtml = useMemo(() => {
    if (!draft) return '';

    const markdown =
      previewMode === 'page'
        ? fullPreviewMarkdown
        : selectorPreviewMarkdown[selector] || selectorPreviewMarkdown.container;

    return applyTheme(md.render(preprocessMarkdown(markdown)), draft);
  }, [draft, previewMode, selector]);

  const [tplPreviewWidth, setTplPreviewWidth] = useState(520);
  const previewWidth = tplPreviewWidth;

  const lockWheelToContainer = (
    event: ReactWheelEvent<HTMLElement>,
    container: HTMLElement | null
  ) => {
    if (!container) return;
    container.scrollTop += event.deltaY;
    if (event.deltaX) {
      container.scrollLeft += event.deltaX;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  useEffect(() => {
    if (selected) setDraft(cloneTemplate(selected));
  }, [selected]);

  useEffect(() => {
    if (!status) return;
    const timeoutId = window.setTimeout(() => setStatus(''), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [status]);

  useEffect(() => {
    if (!isMetaModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMetaModalOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMetaModalOpen]);

  const updateField = (selectorKey: TemplateSelector, field: StyleFieldSpec, nextValue: string) => {
    setDraft((current) => (current ? applyFieldValue(current, selectorKey, field, nextValue) : current));
  };

  const openTemplateMetaModal = () => {
    if (!draft) return;

    setMetaForm({
      name: draft.name,
      id: draft.id,
      description: draft.description,
    });
    setIsMetaModalOpen(true);
  };

  const saveTemplateMeta = () => {
    setDraft((current) => {
      if (!current) return current;

      const nextName = metaForm.name.trim() || current.name;
      const nextId = sanitizeTemplateId(metaForm.id.trim() || nextName || current.id);

      return {
        ...current,
        name: nextName,
        id: nextId,
        description: metaForm.description,
        meta: {
          ...current.meta,
          updatedAt: new Date().toISOString(),
        },
      };
    });
    setIsMetaModalOpen(false);
  };

  const selectTemplate = (templateId: string) => {
    if (dirty && !window.confirm('当前模板有未保存修改，切换后这些修改会丢失。确定继续吗？')) {
      return;
    }
    setActiveTemplateId(templateId);
  };

  const saveCurrentTemplate = async () => {
    if (!draft) return;
    const otherIds = templates.map((template) => template.id).filter((id) => id !== selected?.id);
    const desiredId = sanitizeTemplateId(draft.id || draft.name);
    const finalId =
      desiredId && !otherIds.includes(desiredId)
        ? desiredId
        : ensureUniqueTemplateId(otherIds, draft.name);

    const saved = await saveTemplate({
      ...draft,
      id: finalId,
      meta: {
        ...draft.meta,
        createdAt: draft.meta.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    setDraft(cloneTemplate(saved));
    setStatus(`模板“${saved.name}”已保存。`);
  };

  const deleteCurrentTemplate = async () => {
    if (!selected) return;
    if (!window.confirm(`确定删除模板“${selected.name}”吗？这会直接删除对应的 JSON 模板文件。`)) {
      return;
    }
    await deleteTemplate(selected.id);
    setStatus(`模板“${selected.name}”已删除。`);
  };

  const restoreOfficialTemplates = async () => {
    await restoreSeedTemplates();
    setStatus('官方初始模板已按“缺失则补回”的策略恢复。');
  };

  const createNewTemplate = () => {
    setDraft(createTemplate());
    setStatus('已创建新的模板草稿，保存后会写入模板库。');
  };

  const duplicateCurrentTemplate = () => {
    if (!selected) return;
    setDraft(duplicateTemplate(selected));
    setStatus('已复制当前模板，请保存生成新的模板文件。');
  };

  const exportCurrentTemplate = () => {
    if (!selected) return;
    downloadJson(`${selected.id}.template.json`, selected);
  };

  const exportTemplatePack = () => {
    downloadJson('template-library.pack.json', { version: 1, templates } satisfies TemplatePack);
  };

  const applyToEditor = () => {
    if (!draft) return;
    if (dirty) {
      window.alert('请先保存模板，再应用到主编辑器。');
      return;
    }
    setActiveTemplateId(draft.id);
    navigate('/');
  };

  const importFile = async (mode: ImportMode, file: File) => {
    if (!canWriteTemplates) {
      window.alert('当前环境不支持模板写回，请在本地开发模式下使用导入。');
      return;
    }

    const parsed = JSON.parse(await file.text()) as TemplateDefinition | TemplatePack;

    if (mode === 'pack') {
      if (!isPack(parsed)) {
        window.alert('导入失败：该文件不是合法的模板包。');
        return;
      }

      const conflicts = parsed.templates.filter((template) =>
        templates.some((existing) => existing.id === template.id)
      );
      if (conflicts.length) {
        window.alert(`模板包导入已取消，以下模板 ID 已存在：${conflicts.map((item) => item.id).join(', ')}`);
        return;
      }

      for (const template of parsed.templates) {
        await saveTemplate({
          ...template,
          meta: {
            ...template.meta,
            source: template.meta.source || 'imported',
            updatedAt: new Date().toISOString(),
          },
        });
      }

      setStatus(`已导入模板包，共 ${parsed.templates.length} 套模板。`);
      return;
    }

    if (isPack(parsed)) {
      window.alert('该文件是模板包，请使用“导入整库”。');
      return;
    }

    let nextTemplate = {
      ...parsed,
      meta: {
        ...parsed.meta,
        source: parsed.meta.source || 'imported',
        updatedAt: new Date().toISOString(),
      },
    };

    if (
      templates.some((template) => template.id === nextTemplate.id) &&
      !window.confirm(`模板 ID “${nextTemplate.id}”已存在。确定覆盖吗？点击取消后可改名导入。`)
    ) {
      const prompted = window.prompt(
        '请输入新的模板 ID',
        ensureUniqueTemplateId(
          templates.map((template) => template.id),
          `${nextTemplate.id}-copy`
        )
      );
      if (!prompted) return;

      nextTemplate = {
        ...nextTemplate,
        id: sanitizeTemplateId(prompted),
        name: nextTemplate.name.endsWith(' Copy') ? nextTemplate.name : `${nextTemplate.name} Copy`,
        meta: {
          ...nextTemplate.meta,
          source: 'imported',
          updatedAt: new Date().toISOString(),
        },
      };
    }

    const saved = await saveTemplate(nextTemplate);
    setDraft(cloneTemplate(saved));
    setStatus(`模板“${saved.name}”已导入。`);
  };

  const uploadBackgroundImage = (field: StyleFieldSpec) => {
    if (!draft) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      updateField('container', field, `url("${dataUrl}")`);
      setStatus('背景图已写入当前模板草稿。');
    };
    input.click();
  };

  return (
    <main className="flex-1 overflow-hidden bg-paper">
      <div className="flex h-full flex-col">
        <section className="flex items-center h-10 px-[14px] bg-surface border-b border-rule gap-1 shrink-0 overflow-x-auto no-scrollbar">
          <ActionButton label="新建" icon={<Plus size={12} />} onClick={createNewTemplate} />
          <ActionButton label="复制" icon={<CopyPlus size={12} />} onClick={duplicateCurrentTemplate} disabled={!selected} />
          <ActionButton label="保存" icon={<Save size={12} />} onClick={saveCurrentTemplate} disabled={!draft || !canWriteTemplates} primary />
          <ActionButton label="删除" icon={<Trash2 size={12} />} onClick={deleteCurrentTemplate} disabled={!selected || !canWriteTemplates} />
          <span className="w-px h-[18px] bg-rule-light shrink-0 mx-0.5" />
          <ActionButton label="导入模板" icon={<FileUp size={12} />} onClick={() => singleRef.current?.click()} disabled={!canWriteTemplates} />
          <ActionButton label="导入整库" icon={<FileUp size={12} />} onClick={() => packRef.current?.click()} disabled={!canWriteTemplates} />
          <ActionButton label="导出模板" icon={<FileDown size={12} />} onClick={exportCurrentTemplate} disabled={!selected} />
          <ActionButton label="导出整库" icon={<Download size={12} />} onClick={exportTemplatePack} disabled={!templates.length} />
          <span className="w-px h-[18px] bg-rule-light shrink-0 mx-0.5" />
          <ActionButton label="恢复官方" icon={<RefreshCw size={12} />} onClick={restoreOfficialTemplates} disabled={!canWriteTemplates} />
          <ActionButton label="应用到编辑器" icon={<Check size={12} />} onClick={applyToEditor} disabled={!draft || dirty} />
        </section>

        <div
          className={`grid min-h-0 flex-1 grid-cols-1 ${
            isLibraryCollapsed ? '' : 'xl:grid-cols-[280px_minmax(0,1fr)]'
          }`}
        >
          {!isLibraryCollapsed ? (
            <aside className="flex min-h-0 flex-col border-r border-rule-light bg-surface">
              <div className="flex items-center justify-between border-b border-rule-light px-4 py-3">
                  <div>
                    <h3 className="font-display text-[15px] font-semibold text-ink">模板库</h3>
                    <p className="text-[11.5px] text-ink-faint">全部模板文件</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLibraryCollapsed(true)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] border border-rule-light text-ink-faint transition-colors hover:bg-surface-dim hover:text-ink-muted"
                    title="折叠侧栏"
                  >
                    <ChevronLeft size={14} />
                  </button>
              </div>
              {draft ? (
                <div className="mx-3 my-3 rounded-lg border border-rule-light bg-surface-editor p-3 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-faint">Current</span>
                      {dirty ? (
                        <span className="ml-1.5 inline-block rounded-[3px] bg-[#FEF3C7] px-[5px] py-px text-[9.5px] font-semibold text-[#92700C]">Unsaved</span>
                      ) : null}
                      <p className="mt-1 truncate text-[14px] font-semibold text-ink">{draft.name}</p>
                      <p className="truncate text-[10.5px] text-ink-faint font-mono mt-0.5">{draft.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={openTemplateMetaModal}
                      className="icon-btn-sm"
                      title="Edit template info"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                </div>
              ) : null}
              <div
                ref={templateLibraryScrollRef}
                onWheel={(event) => lockWheelToContainer(event, templateLibraryScrollRef.current)}
                className="flex-1 space-y-[5px] overflow-y-auto overscroll-contain px-3 py-2"
              >
                {templates.map((template) => {
                  const active = template.id === activeTemplateId;
                  return (
                    <button
                      key={template.id}
                      onClick={() => selectTemplate(template.id)}
                      className={`w-full rounded-[7px] border p-[10px] text-left transition-all ${
                        active
                          ? 'border-ink-muted bg-rule-faint'
                          : 'border-rule-light bg-surface hover:border-rule hover:bg-surface-editor'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold text-ink">{template.name}</p>
                        {active ? <Check size={12} className="shrink-0 text-ink-soft" /> : null}
                      </div>
                      <p className="truncate text-[10px] text-ink-faint font-mono mt-0.5">{template.id}</p>
                      <p className="mt-1 line-clamp-2 text-[11.5px] leading-[1.45] text-ink-muted">{template.description}</p>
                      <p className="mt-1 text-[10px] text-ink-faint">来源：{template.meta.source}</p>
                    </button>
                  );
                })}
              </div>
            </aside>
          ) : null}

          <section className="relative min-h-0 overflow-hidden px-4 py-3">
            {draft ? (
              <div className="h-full min-h-0">
                {isLibraryCollapsed ? (
                  <button
                    type="button"
                    onClick={() => setIsLibraryCollapsed(false)}
                    className="absolute left-1 top-1 z-20 inline-flex h-8 items-center justify-center rounded-[5px] border border-rule-light bg-surface px-2.5 text-[11px] font-semibold text-ink-muted shadow-sm transition-colors hover:bg-surface-dim hover:text-ink-soft"
                    title="展开模板库"
                  >
                    库
                  </button>
                ) : null}

                <section
                  className={`grid h-full min-h-0 grid-cols-1 gap-4 ${isLibraryCollapsed ? '2xl:grid-cols-[500px_minmax(0,1fr)]' : '2xl:grid-cols-[440px_minmax(0,1fr)]'}`}
                >
                  <div className="flex min-h-0 flex-col rounded-[10px] border border-rule bg-surface overflow-hidden">
                    <div className="px-[14px] py-3 border-b border-rule-light shrink-0">
                      <h3 className="text-[14px] font-semibold text-ink">选择器编辑区</h3>
                      <p className="text-[11.5px] text-ink-faint mt-0.5">选择 CSS 选择器，编辑其样式属性</p>
                    </div>

                    <div
                      ref={selectorEditorScrollRef}
                      onWheel={(event) => lockWheelToContainer(event, selectorEditorScrollRef.current)}
                      className="mt-3 flex-1 overflow-auto overscroll-contain pr-1"
                    >
                      <div className="flex flex-wrap gap-[3px] px-[14px] py-[10px] border-b border-rule-light shrink-0">
                        {TEMPLATE_STYLE_CATALOG.map((item) => (
                          <button
                            key={item.selector}
                            onClick={() => setSelector(item.selector)}
                            className={`rounded-[4px] px-2 py-[3px] text-[11px] font-medium font-mono transition-colors ${
                              selector === item.selector
                                ? 'bg-rule-faint text-ink border border-ink-ghost font-semibold'
                                : 'bg-surface-dim text-ink-muted border border-transparent'
                            }`}
                          >
                            {item.selector}
                          </button>
                        ))}
                      </div>

                      {catalog ? (
                        <div className="space-y-4 pb-4 px-[14px] pt-3">


                        {/^h[1-4]$/.test(selector) && (
                          <div className="rounded-lg border border-rule-light bg-surface-dim px-3 py-3">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">预设</span>
                            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                              {HEADING_PRESETS.map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  title={preset.description}
                                  className="ink-btn-outline !px-3 !py-2 !text-[12px]"
                                  onClick={() =>
                                    setDraft((current) => {
                                      if (!current) return current;
                                      const nextTemplate = cloneTemplate(current);
                                      const nextStyle = cloneStyleDeclaration(
                                        nextTemplate.selectorStyles[selector]
                                      );
                                      for (const [prop, val] of Object.entries(preset.styles)) {
                                        if (val) {
                                          nextStyle[prop] = val;
                                        } else {
                                          delete nextStyle[prop];
                                        }
                                      }
                                      nextTemplate.selectorStyles[selector] = nextStyle;
                                      nextTemplate.globalStyles = deriveGlobalStyles(
                                        nextTemplate.selectorStyles
                                      );
                                      nextTemplate.meta.updatedAt = new Date().toISOString();
                                      return nextTemplate;
                                    })
                                  }
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {selector === 'hr' && (
                          <div className="rounded-lg border border-rule-light bg-surface-dim px-3 py-3">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">预设</span>
                            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                              {HR_PRESETS.map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  title={preset.description}
                                  className="ink-btn-outline !px-3 !py-2 !text-[12px]"
                                  onClick={() =>
                                    setDraft((current) => {
                                      if (!current) return current;
                                      const nextTemplate = cloneTemplate(current);
                                      const nextStyle = cloneStyleDeclaration(
                                        nextTemplate.selectorStyles[selector]
                                      );
                                      for (const [prop, val] of Object.entries(preset.styles)) {
                                        if (val) {
                                          nextStyle[prop] = val;
                                        } else {
                                          delete nextStyle[prop];
                                        }
                                      }
                                      nextTemplate.selectorStyles[selector] = nextStyle;
                                      nextTemplate.globalStyles = deriveGlobalStyles(
                                        nextTemplate.selectorStyles
                                      );
                                      nextTemplate.meta.updatedAt = new Date().toISOString();
                                      return nextTemplate;
                                    })
                                  }
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {(selector === 'blockquote' || selector === 'pre' || selector === 'img') && (
                          <div className="rounded-lg border border-rule-light bg-surface-dim px-3 py-3">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">预设</span>
                            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                              {(selector === 'blockquote' ? BLOCKQUOTE_PRESETS : selector === 'img' ? IMG_PRESETS : PRE_PRESETS).map(
                                (preset) => (
                                  <button
                                    key={preset.label}
                                    type="button"
                                    title={preset.description}
                                    className="ink-btn-outline !px-3 !py-2 !text-[12px]"
                                    onClick={() =>
                                      setDraft((current) => {
                                        if (!current) return current;
                                        const nextTemplate = cloneTemplate(current);
                                        const nextStyle = cloneStyleDeclaration(
                                          nextTemplate.selectorStyles[selector]
                                        );
                                        for (const [prop, val] of Object.entries(preset.styles)) {
                                          if (val) {
                                            nextStyle[prop] = val;
                                          } else {
                                            delete nextStyle[prop];
                                          }
                                        }
                                        nextTemplate.selectorStyles[selector] = nextStyle;
                                        nextTemplate.globalStyles = deriveGlobalStyles(
                                          nextTemplate.selectorStyles
                                        );
                                        nextTemplate.meta.updatedAt = new Date().toISOString();
                                        return nextTemplate;
                                      })
                                    }
                                  >
                                    {preset.label}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {SECTIONS.map((section, sectionIndex) => {
                          const fields = catalog.fields.filter((field) => field.section === section);
                          if (!fields.length) return null;

                          const fieldContent = (
                            <div className="mt-2 grid grid-cols-1 gap-4">
                              {fields.map((field) => (
                                <StyleField
                                  key={field.key}
                                  field={field}
                                  value={readFieldValue(draft, selector, field)}
                                  onChange={(nextValue) => updateField(selector, field, nextValue)}
                                  onUploadImage={
                                    field.input === 'background-image'
                                      ? () => uploadBackgroundImage(field)
                                      : undefined
                                  }
                                />
                              ))}
                            </div>
                          );

                          return (
                            <details key={section} className="group" open={sectionIndex === 0}>
                              <summary className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-muted select-none">
                                <span className="transition-transform group-open:rotate-90">▶</span>
                                {section}
                                <span className="text-[11px] font-normal normal-case tracking-normal text-ink-faint">
                                  {fields.length} 项
                                </span>
                              </summary>
                              {fieldContent}
                            </details>
                          );
                        })}

                        <details className="rounded-lg border border-rule-light bg-surface-dim px-3 py-3">
                          <summary className="cursor-pointer text-[12px] font-semibold text-ink-soft">
                            高级 CSS
                          </summary>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {ADVANCED_PRESETS.map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                className="ink-btn-outline !px-3 !py-2 !text-[12px]"
                                onClick={() =>
                                  setDraft((current) => {
                                    if (!current) return current;
                                    const nextTemplate = cloneTemplate(current);
                                    nextTemplate.advancedStyles[selector] = toStyle(preset.snippet);
                                    nextTemplate.meta.updatedAt = new Date().toISOString();
                                    return nextTemplate;
                                  })
                                }
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                          <textarea
                            className="mt-3 min-h-[140px] w-full rounded-lg border border-rule-light bg-surface px-3 py-2 text-[13px] outline-none"
                            value={toLines(draft.advancedStyles[selector])}
                            onChange={(event) =>
                              setDraft((current) =>
                                current
                                  ? {
                                      ...cloneTemplate(current),
                                      advancedStyles: {
                                        ...cloneTemplate(current).advancedStyles,
                                        [selector]: toStyle(event.target.value),
                                      },
                                      meta: {
                                        ...current.meta,
                                        updatedAt: new Date().toISOString(),
                                      },
                                    }
                                  : current
                              )
                            }
                            placeholder={'box-shadow: 0 8px 24px rgba(0,0,0,0.12);\nfilter: blur(2px);'}
                          />
                        </details>
                      </div>
                    ) : null}
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-col rounded-[10px] border border-rule bg-surface-dim overflow-hidden">
                    <div className="flex items-center justify-between gap-3 shrink-0">
                      <div className="pill-group">
                        <button
                          onClick={() => setPreviewMode('block')}
                          className={`pill-item ${previewMode === 'block' ? 'pill-item-active' : ''}`}
                        >
                          单选择器
                        </button>
                        <button
                          onClick={() => setPreviewMode('page')}
                          className={`pill-item ${previewMode === 'page' ? 'pill-item-active' : ''}`}
                        >
                          整页预览
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="width-preset-group">
                          {[375, 520, 680].map((w) => (
                            <button
                              key={w}
                              className={`width-preset-btn ${tplPreviewWidth === w ? 'width-preset-btn-active' : ''}`}
                              onClick={() => setTplPreviewWidth(w)}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                        <input
                          type="range"
                          className="width-slider"
                          min={320}
                          max={800}
                          value={tplPreviewWidth}
                          onChange={(e) => setTplPreviewWidth(Number(e.target.value))}
                        />
                        <span className="text-[10.5px] font-medium text-ink-faint font-mono min-w-[36px]">{tplPreviewWidth}px</span>
                      </div>
                    </div>

                    <div className="min-h-0 h-full flex-1 overflow-hidden">
                      <PreviewPanel
                        renderedHtml={previewHtml}
                        previewWidth={previewWidth}
                        previewRef={previewContentRef}
                        previewScrollRef={previewScrollRef}
                        onPreviewScroll={() => {}}
                        scrollSyncEnabled={false}
                      />
                    </div>
                  </div>
                </section>
              </div>
            ) : null}
          </section>
        </div>
      </div>

{status ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-[120]">
          <div className="rounded-lg bg-black px-4 py-3 text-[13px] text-white shadow-lg">
            {status}
          </div>
        </div>
      ) : null}

      {isMetaModalOpen ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/30 px-4"
          onClick={() => setIsMetaModalOpen(false)}
        >
          <div
            className="w-full max-w-[560px] rounded-lg border border-rule-light bg-surface p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-semibold text-ink">Edit Template Info</h2>
                <p className="mt-2 text-[13px] leading-6 text-ink-muted">
                  Update the template name, file id, and description here. Use the top Save button when you want to write the changes back to the JSON file.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMetaModalOpen(false)}
                className="rounded-[6px] border border-rule-light px-3 py-2 text-[12px] font-medium text-ink-soft transition-colors hover:bg-surface-dim"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4">
              <label className="flex flex-col gap-2 text-[13px] text-ink">
                <LabelRow label="Template Name" helperText="Shown in the template library." />
                <input
                  className="rounded-lg border border-rule-light bg-surface px-3 py-2 text-[13px] outline-none"
                  value={metaForm.name}
                  onChange={(event) => setMetaForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>

              <label className="flex flex-col gap-2 text-[13px] text-ink">
                <LabelRow
                  label="Template File ID"
                  helperText="This becomes the JSON filename, so lowercase letters, numbers, and hyphens work best."
                />
                <input
                  className="rounded-lg border border-rule-light bg-surface px-3 py-2 text-[13px] outline-none"
                  value={metaForm.id}
                  onChange={(event) => setMetaForm((current) => ({ ...current, id: event.target.value }))}
                  placeholder="my-template"
                />
              </label>

              <label className="flex flex-col gap-2 text-[13px] text-ink">
                <LabelRow label="Template Description" helperText="Shown in the sidebar card for quick recognition." />
                <textarea
                  className="min-h-[120px] rounded-lg border border-rule-light bg-surface px-3 py-2 text-[13px] outline-none"
                  value={metaForm.description}
                  onChange={(event) => setMetaForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsMetaModalOpen(false)}
                className="ink-btn-outline"
              >
                Cancel
              </button>
              <button type="button" onClick={saveTemplateMeta} className="ink-btn-dark">
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <input
        ref={singleRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) await importFile('single', file);
          event.currentTarget.value = '';
        }}
      />
      <input
        ref={packRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) await importFile('pack', file);
          event.currentTarget.value = '';
        }}
      />
    </main>
  );
}
