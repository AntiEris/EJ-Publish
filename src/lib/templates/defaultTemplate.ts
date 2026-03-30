import type { TemplateDefinition } from './types';
import { deriveGlobalStyles } from './styleUtils';

const baseSelectorStyles: TemplateDefinition['selectorStyles'] = {
  container: {
    'max-width': '100%',
    margin: '0 auto',
    padding: '24px 20px 48px 20px',
    'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    'font-size': '16px',
    'line-height': '1.7',
    color: '#1d1d1f',
    'background-color': '#ffffff',
    'word-wrap': 'break-word',
  },
  h1: {
    'font-size': '32px',
    'font-weight': '700',
    color: '#111111',
    'line-height': '1.3',
    margin: '38px 0 16px',
    'letter-spacing': '-0.015em',
  },
  h2: {
    'font-size': '26px',
    'font-weight': '600',
    color: '#111111',
    'line-height': '1.35',
    margin: '32px 0 16px',
  },
  h3: {
    'font-size': '21px',
    'font-weight': '600',
    color: '#1d1d1f',
    'line-height': '1.4',
    margin: '28px 0 14px',
  },
  h4: {
    'font-size': '18px',
    'font-weight': '600',
    color: '#1d1d1f',
    'line-height': '1.4',
    margin: '24px 0 12px',
  },
  p: {
    margin: '18px 0',
    'line-height': '1.7',
    color: '#1d1d1f',
  },
  strong: {
    'font-weight': '700',
    color: '#000000',
  },
  em: {
    'font-style': 'italic',
    color: '#666666',
  },
  u: {
    color: '#1d1d1f',
    'text-decoration-line': 'underline',
    'text-decoration-color': 'currentColor',
    'text-decoration-style': 'solid',
    'text-underline-offset': '2px',
  },
  a: {
    color: '#0066cc',
    'text-decoration': 'none',
    'border-bottom': '1px solid #0066cc',
    'padding-bottom': '1px',
  },
  ul: {
    margin: '16px 0',
    'padding-left': '28px',
  },
  ol: {
    margin: '16px 0',
    'padding-left': '28px',
  },
  li: {
    margin: '8px 0',
    'line-height': '1.7',
    color: '#1d1d1f',
  },
  blockquote: {
    margin: '24px 0',
    padding: '16px 20px',
    'background-color': '#f5f5f7',
    'border-left': '4px solid #0066cc',
    color: '#555555',
    'border-radius': '4px',
  },
  code: {
    'font-family': '"SF Mono", Consolas, monospace',
    padding: '3px 6px',
    'background-color': '#f5f5f7',
    color: '#0066cc',
    'border-radius': '4px',
    'font-size': '12px',
    'line-height': '1.5',
  },
  pre: {
    margin: '24px 0',
    padding: '20px',
    'background-color': '#f5f5f7',
    'border-radius': '8px',
    'overflow-x': 'auto',
    'font-size': '12px',
    'line-height': '1.5',
  },
  hr: {
    margin: '36px auto',
    border: 'none',
    height: '1px',
    'background-color': '#eaeaea',
    width: '100%',
  },
  img: {
    'max-width': '100%',
    height: 'auto',
    display: 'block',
    margin: '24px auto',
    'border-radius': '12px',
  },
  table: {
    width: '100%',
    margin: '24px 0',
    'border-collapse': 'collapse',
    'font-size': '15px',
  },
  th: {
    'background-color': '#f5f5f7',
    padding: '12px 16px',
    'text-align': 'left',
    'font-weight': '600',
    color: '#1d1d1f',
    border: '1px solid #e0e0e0',
  },
  td: {
    padding: '12px 16px',
    border: '1px solid #e0e0e0',
    color: '#1d1d1f',
  },
  tr: {
    border: 'none',
  },
};

export function createBlankTemplate(id: string, name: string): TemplateDefinition {
  return {
    id,
    name,
    description: '由模板工作台创建的自定义模板',
    meta: {
      version: 1,
      group: 'Custom',
      icon: null,
      source: 'custom',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    globalStyles: deriveGlobalStyles(baseSelectorStyles),
    selectorStyles: JSON.parse(JSON.stringify(baseSelectorStyles)),
    advancedStyles: {},
  };
}
