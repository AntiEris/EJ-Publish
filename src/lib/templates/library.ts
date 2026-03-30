import type { TemplateDefinition, TemplateGroup } from './types';

const templateModules = import.meta.glob('../../template-library/templates/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, TemplateDefinition>;

export function getBundledTemplates(): TemplateDefinition[] {
  return Object.values(templateModules).sort((left, right) => left.name.localeCompare(right.name));
}

export function getTemplateGroups(templates: TemplateDefinition[]): TemplateGroup[] {
  return [
    {
      label: 'All Templates',
      templates: [...templates].sort((left, right) => left.name.localeCompare(right.name)),
    },
  ];
}

export function getTemplateById(templates: TemplateDefinition[], templateId: string): TemplateDefinition | undefined {
  return templates.find((template) => template.id === templateId);
}
