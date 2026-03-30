export const TEMPLATE_SELECTORS = [
  'container',
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  'strong',
  'em',
  'u',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'hr',
  'img',
  'table',
  'th',
  'td',
  'tr',
] as const;

export type TemplateSelector = (typeof TEMPLATE_SELECTORS)[number];

export type StyleDeclaration = Record<string, string>;

export interface GlobalStyles {
  page: StyleDeclaration;
  body: StyleDeclaration;
  paragraph: StyleDeclaration;
  headings: Record<'h1' | 'h2' | 'h3' | 'h4', StyleDeclaration>;
}

export interface TemplateMeta {
  version: number;
  group: string;
  icon: string | null;
  source: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  meta: TemplateMeta;
  globalStyles: GlobalStyles;
  selectorStyles: Record<string, StyleDeclaration>;
  advancedStyles: Record<string, StyleDeclaration>;
}

export interface TemplateGroup {
  label: string;
  templates: TemplateDefinition[];
}

export interface TemplatePack {
  version: 1;
  templates: TemplateDefinition[];
}

export interface TemplateSavePayload {
  template: TemplateDefinition;
}

export interface TemplateApiResponse {
  templates: TemplateDefinition[];
}
