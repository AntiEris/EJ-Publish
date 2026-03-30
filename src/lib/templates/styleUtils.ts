import type {
  GlobalStyles,
  StyleDeclaration,
  TemplateDefinition,
  TemplateSelector,
} from './types';

const PAGE_KEYS = ['background-color', 'background-image', 'max-width', 'padding', 'margin', 'word-wrap'];
const BODY_KEYS = ['font-family', 'font-size', 'line-height', 'color'];
const PARAGRAPH_KEYS = ['margin', 'line-height', 'font-size', 'color'];
const HEADING_KEYS = [
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'color',
  'margin',
  'text-transform',
  'font-variant',
  'border-bottom',
  'padding-bottom',
  'padding-left',
  'border-left',
  'text-shadow',
];

export function cloneStyleDeclaration(input?: StyleDeclaration): StyleDeclaration {
  return { ...(input || {}) };
}

export function cloneTemplate(template: TemplateDefinition): TemplateDefinition {
  return {
    ...template,
    meta: { ...template.meta },
    globalStyles: {
      page: cloneStyleDeclaration(template.globalStyles.page),
      body: cloneStyleDeclaration(template.globalStyles.body),
      paragraph: cloneStyleDeclaration(template.globalStyles.paragraph),
      headings: {
        h1: cloneStyleDeclaration(template.globalStyles.headings.h1),
        h2: cloneStyleDeclaration(template.globalStyles.headings.h2),
        h3: cloneStyleDeclaration(template.globalStyles.headings.h3),
        h4: cloneStyleDeclaration(template.globalStyles.headings.h4),
      },
    },
    selectorStyles: Object.fromEntries(
      Object.entries(template.selectorStyles).map(([selector, styles]) => [selector, cloneStyleDeclaration(styles)])
    ),
    advancedStyles: Object.fromEntries(
      Object.entries(template.advancedStyles).map(([selector, styles]) => [selector, cloneStyleDeclaration(styles)])
    ),
  };
}

export function styleDeclarationToString(style: StyleDeclaration | undefined): string {
  if (!style) return '';

  return Object.entries(style)
    .filter(([, value]) => `${value}`.trim().length > 0)
    .map(([property, value]) => `${property}: ${value};`)
    .join(' ');
}

export function mergeStyleDeclarations(...styles: Array<StyleDeclaration | undefined>): StyleDeclaration {
  return styles.reduce<StyleDeclaration>((acc, style) => {
    if (!style) return acc;
    for (const [property, value] of Object.entries(style)) {
      if (`${value}`.trim().length === 0) {
        delete acc[property];
      } else {
        acc[property] = value;
      }
    }
    return acc;
  }, {});
}

function pick(source: StyleDeclaration | undefined, keys: string[]): StyleDeclaration {
  const result: StyleDeclaration = {};
  if (!source) return result;

  for (const key of keys) {
    if (source[key]) {
      result[key] = source[key];
    }
  }
  return result;
}

export function deriveGlobalStyles(selectorStyles: Record<string, StyleDeclaration>): GlobalStyles {
  return {
    page: pick(selectorStyles.container, PAGE_KEYS),
    body: pick(selectorStyles.container, BODY_KEYS),
    paragraph: pick(selectorStyles.p, PARAGRAPH_KEYS),
    headings: {
      h1: pick(selectorStyles.h1, HEADING_KEYS),
      h2: pick(selectorStyles.h2, HEADING_KEYS),
      h3: pick(selectorStyles.h3, HEADING_KEYS),
      h4: pick(selectorStyles.h4, HEADING_KEYS),
    },
  };
}

export function buildTemplateStyleMap(template: TemplateDefinition): Record<string, StyleDeclaration> {
  const mergedSelectors: Record<string, StyleDeclaration> = {};
  const selectorNames = new Set([
    ...Object.keys(template.selectorStyles || {}),
    ...Object.keys(template.advancedStyles || {}),
  ]);

  for (const selector of selectorNames) {
    const mergedStyle = mergeStyleDeclarations(
      template.selectorStyles[selector],
      template.advancedStyles[selector]
    );

    if (
      ['u', 'a'].includes(selector) &&
      (mergedStyle['text-decoration-style'] ||
        mergedStyle['text-decoration-color'] ||
        mergedStyle['text-underline-offset'])
    ) {
      const textDecoration = mergedStyle['text-decoration'] || '';
      const hasLine = Boolean(mergedStyle['text-decoration-line']);

      if (!hasLine && textDecoration && textDecoration !== 'none') {
        mergedStyle['text-decoration-line'] = textDecoration;
      }

      if (selector === 'u' && !mergedStyle['text-decoration-line']) {
        mergedStyle['text-decoration-line'] = 'underline';
      }

      delete mergedStyle['text-decoration'];
    }

    mergedSelectors[selector] = mergedStyle;
  }
  return mergedSelectors;
}

export function updateSelectorProperty(
  template: TemplateDefinition,
  selector: TemplateSelector,
  property: string,
  value: string
): TemplateDefinition {
  const next = cloneTemplate(template);
  const selectorStyles = cloneStyleDeclaration(next.selectorStyles[selector]);

  if (value.trim()) {
    selectorStyles[property] = value;
  } else {
    delete selectorStyles[property];
  }

  next.selectorStyles[selector] = selectorStyles;
  next.globalStyles = deriveGlobalStyles(next.selectorStyles);
  next.meta.updatedAt = new Date().toISOString();
  return next;
}

export function updateAdvancedProperty(
  template: TemplateDefinition,
  selector: TemplateSelector,
  property: string,
  value: string
): TemplateDefinition {
  const next = cloneTemplate(template);
  const selectorStyles = cloneStyleDeclaration(next.advancedStyles[selector]);

  if (value.trim()) {
    selectorStyles[property] = value;
  } else {
    delete selectorStyles[property];
  }

  next.advancedStyles[selector] = selectorStyles;
  next.meta.updatedAt = new Date().toISOString();
  return next;
}

export function sanitizeTemplateId(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function ensureUniqueTemplateId(existingIds: string[], desiredId: string): string {
  const safeId = sanitizeTemplateId(desiredId) || 'template';
  if (!existingIds.includes(safeId)) return safeId;

  let index = 2;
  while (existingIds.includes(`${safeId}-${index}`)) {
    index += 1;
  }
  return `${safeId}-${index}`;
}
