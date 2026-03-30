import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createBlankTemplate } from './defaultTemplate';
import { getBundledTemplates, getTemplateById, getTemplateGroups } from './library';
import { cloneTemplate, ensureUniqueTemplateId } from './styleUtils';
import type { TemplateApiResponse, TemplateDefinition, TemplateGroup } from './types';

interface TemplateLibraryContextValue {
  templates: TemplateDefinition[];
  templateGroups: TemplateGroup[];
  activeTemplateId: string;
  activeTemplate: TemplateDefinition;
  canWriteTemplates: boolean;
  loading: boolean;
  error: string | null;
  setActiveTemplateId: (templateId: string) => void;
  reloadTemplates: () => Promise<void>;
  saveTemplate: (template: TemplateDefinition) => Promise<TemplateDefinition>;
  deleteTemplate: (templateId: string) => Promise<void>;
  restoreSeedTemplates: () => Promise<void>;
  createTemplate: (name?: string) => TemplateDefinition;
  duplicateTemplate: (template: TemplateDefinition) => TemplateDefinition;
}

const TemplateLibraryContext = createContext<TemplateLibraryContextValue | null>(null);
const TEMPLATE_API_BASE = '/__template_api';
const DEFAULT_TEMPLATE_ID = 'default';
const LS_KEY = 'ej-publish:user-templates';

type LocalTemplateMap = Record<string, TemplateDefinition | null>;

function readLocalTemplates(): LocalTemplateMap {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as LocalTemplateMap) : {};
  } catch {
    return {};
  }
}

function writeLocalTemplates(map: LocalTemplateMap): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    // quota exceeded — silently fail, data stays in React state for this session
  }
}

function mergeTemplates(bundled: TemplateDefinition[]): TemplateDefinition[] {
  const userMap = readLocalTemplates();
  const merged: Record<string, TemplateDefinition> = Object.fromEntries(bundled.map((t) => [t.id, t]));
  for (const [id, value] of Object.entries(userMap)) {
    if (value === null) {
      delete merged[id];
    } else {
      merged[id] = value;
    }
  }
  return Object.values(merged).sort((a, b) => a.name.localeCompare(b.name));
}

function resolvePreferredTemplateId(templates: TemplateDefinition[], currentId?: string) {
  if (currentId && templates.some((template) => template.id === currentId)) return currentId;
  if (templates.some((template) => template.id === DEFAULT_TEMPLATE_ID)) return DEFAULT_TEMPLATE_ID;
  return templates[0]?.id || '';
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function TemplateLibraryProvider({ children }: { children: ReactNode }) {
  const fallbackTemplates = useMemo(() => getBundledTemplates(), []);
  const [templates, setTemplates] = useState<TemplateDefinition[]>(fallbackTemplates);
  const [activeTemplateId, setActiveTemplateId] = useState<string>(resolvePreferredTemplateId(fallbackTemplates));
  const [canWriteTemplates, setCanWriteTemplates] = useState(false);
  const [useLocalStorageMode, setUseLocalStorageMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadTemplates = useCallback(async () => {
    try {
      const payload = await fetchJson<TemplateApiResponse>(`${TEMPLATE_API_BASE}/templates`);
      const nextTemplates = payload.templates.sort((left, right) => left.name.localeCompare(right.name));
      setTemplates(nextTemplates);
      setCanWriteTemplates(true);
      setError(null);
      setActiveTemplateId((currentId) => resolvePreferredTemplateId(nextTemplates, currentId));
    } catch {
      const nextTemplates = mergeTemplates(fallbackTemplates);
      setTemplates(nextTemplates);
      setCanWriteTemplates(true);
      setUseLocalStorageMode(true);
      setError(null);
      setActiveTemplateId((currentId) => resolvePreferredTemplateId(nextTemplates, currentId));
    } finally {
      setLoading(false);
    }
  }, [fallbackTemplates]);

  useEffect(() => {
    void reloadTemplates();
  }, [reloadTemplates]);

  const saveTemplate = useCallback(async (template: TemplateDefinition) => {
    if (useLocalStorageMode) {
      const map = readLocalTemplates();
      map[template.id] = template;
      writeLocalTemplates(map);
      const nextTemplates = mergeTemplates(fallbackTemplates);
      setTemplates(nextTemplates);
      setActiveTemplateId(template.id);
      return template;
    }
    const saved = await fetchJson<{ template: TemplateDefinition }>(`${TEMPLATE_API_BASE}/templates`, {
      method: 'PUT',
      body: JSON.stringify({ template }),
    });
    await reloadTemplates();
    setActiveTemplateId(saved.template.id);
    return saved.template;
  }, [useLocalStorageMode, fallbackTemplates, reloadTemplates]);

  const deleteTemplate = useCallback(async (templateId: string) => {
    if (useLocalStorageMode) {
      const map = readLocalTemplates();
      const isBundled = fallbackTemplates.some((t) => t.id === templateId);
      if (isBundled) {
        map[templateId] = null;
      } else {
        delete map[templateId];
      }
      writeLocalTemplates(map);
      const nextTemplates = mergeTemplates(fallbackTemplates);
      setTemplates(nextTemplates);
      return;
    }
    await fetchJson<{ ok: true }>(`${TEMPLATE_API_BASE}/templates/${encodeURIComponent(templateId)}`, {
      method: 'DELETE',
    });
    await reloadTemplates();
  }, [useLocalStorageMode, fallbackTemplates, reloadTemplates]);

  const restoreSeedTemplates = useCallback(async () => {
    if (useLocalStorageMode) {
      localStorage.removeItem(LS_KEY);
      const nextTemplates = [...fallbackTemplates].sort((a, b) => a.name.localeCompare(b.name));
      setTemplates(nextTemplates);
      setActiveTemplateId((id) => resolvePreferredTemplateId(nextTemplates, id));
      return;
    }
    await fetchJson<{ ok: true }>(`${TEMPLATE_API_BASE}/restore`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    await reloadTemplates();
  }, [useLocalStorageMode, fallbackTemplates, reloadTemplates]);

  const createTemplate = useCallback((name = 'New Template') => {
    const id = ensureUniqueTemplateId(templates.map((template) => template.id), name);
    return createBlankTemplate(id, name);
  }, [templates]);

  const duplicateTemplate = useCallback((template: TemplateDefinition) => {
    const copy = cloneTemplate(template);
    const name = `${template.name} Copy`;
    const id = ensureUniqueTemplateId(templates.map((item) => item.id), name);
    copy.id = id;
    copy.name = name;
    copy.meta = {
      ...copy.meta,
      source: 'custom',
      group: 'Custom',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return copy;
  }, [templates]);

  const activeTemplate = getTemplateById(templates, activeTemplateId) || templates[0] || createBlankTemplate('blank', 'Blank');
  const templateGroups = useMemo(() => getTemplateGroups(templates), [templates]);

  const value = useMemo<TemplateLibraryContextValue>(() => ({
    templates,
    templateGroups,
    activeTemplateId,
    activeTemplate,
    canWriteTemplates,
    loading,
    error,
    setActiveTemplateId,
    reloadTemplates,
    saveTemplate,
    deleteTemplate,
    restoreSeedTemplates,
    createTemplate,
    duplicateTemplate,
  }), [
    activeTemplate,
    activeTemplateId,
    canWriteTemplates,
    createTemplate,
    deleteTemplate,
    duplicateTemplate,
    error,
    loading,
    reloadTemplates,
    restoreSeedTemplates,
    saveTemplate,
    templateGroups,
    templates,
  ]);

  return <TemplateLibraryContext.Provider value={value}>{children}</TemplateLibraryContext.Provider>;
}

export function useTemplateLibrary() {
  const context = useContext(TemplateLibraryContext);
  if (!context) {
    throw new Error('useTemplateLibrary must be used within TemplateLibraryProvider');
  }
  return context;
}
