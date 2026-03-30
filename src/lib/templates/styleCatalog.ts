import type { StyleDeclaration, TemplateSelector } from './types';

export type StyleSection =
  | 'Typography'
  | 'Color / Background'
  | 'Spacing'
  | 'Border / Radius'
  | 'Effects'
  | 'Advanced';

export type StyleInputKind =
  | 'text'
  | 'textarea'
  | 'color'
  | 'select'
  | 'font-family'
  | 'font-size'
  | 'line-height'
  | 'spacing'
  | 'length'
  | 'background-image';

export type StyleValueMode = 'plain' | 'border-color' | 'multi-target';

export interface MultiTargetBinding {
  selector: TemplateSelector;
  property: string;
}

export interface StyleFieldSpec {
  key: string;
  property: string;
  label: string;
  section: StyleSection;
  input: StyleInputKind;
  valueMode?: StyleValueMode;
  targets?: MultiTargetBinding[];
  placeholder?: string;
  options?: string[];
  helperText?: string;
  example?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface SelectorStyleCatalog {
  selector: TemplateSelector;
  label: string;
  fields: StyleFieldSpec[];
}

export interface GlobalStyleFieldSpec extends StyleFieldSpec {
  selector: TemplateSelector;
}

export const FONT_FAMILY_OPTIONS = [
  {
    label: '系统无衬线',
    value:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    label: '微软雅黑 / 苹方',
    value: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    label: '黑体',
    value: '"SimHei", "STHeiti", sans-serif',
  },
  {
    label: '宋体',
    value: '"SimSun", "Songti SC", serif',
  },
  {
    label: '楷体',
    value: '"KaiTi", "STKaiti", serif',
  },
  {
    label: '仿宋',
    value: '"FangSong", "STFangsong", serif',
  },
  {
    label: '衬线阅读',
    value: 'Georgia, "Times New Roman", "Songti SC", serif',
  },
  {
    label: 'Arial',
    value: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
  },
  {
    label: '等宽代码',
    value: '"SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
];

const select = (
  key: string,
  property: string,
  label: string,
  section: StyleSection,
  options: string[],
  helperText?: string,
  example?: string
): StyleFieldSpec => ({
  key,
  property,
  label,
  section,
  input: 'select',
  options,
  helperText,
  example,
});

const text = (
  key: string,
  property: string,
  label: string,
  section: StyleSection,
  placeholder?: string,
  helperText?: string,
  example?: string
): StyleFieldSpec => ({
  key,
  property,
  label,
  section,
  input: 'text',
  placeholder,
  helperText,
  example,
});

const color = (
  key: string,
  property: string,
  label: string,
  section: StyleSection,
  helperText?: string,
  example?: string
): StyleFieldSpec => ({
  key,
  property,
  label,
  section,
  input: 'color',
  helperText,
  example,
});

const fontFamily = (
  key: string,
  property: string,
  label: string,
  section: StyleSection,
  helperText?: string
): StyleFieldSpec => ({
  key,
  property,
  label,
  section,
  input: 'font-family',
  helperText,
});

const fontSize = (
  key: string,
  property: string,
  label: string,
  section: StyleSection,
  min: number,
  max: number,
  step = 1,
  helperText?: string
): StyleFieldSpec => ({
  key,
  property,
  label,
  section,
  input: 'font-size',
  min,
  max,
  step,
  unit: 'px',
  helperText,
});

const lineHeight = (
  key: string,
  property: string,
  label: string,
  section: StyleSection,
  helperText?: string
): StyleFieldSpec => ({
  key,
  property,
  label,
  section,
  input: 'line-height',
  min: 1.1,
  max: 2.4,
  step: 0.05,
  helperText,
});

const spacing = (
  key: string,
  property: string,
  label: string,
  section: StyleSection,
  helperText?: string,
  example?: string
): StyleFieldSpec => ({
  key,
  property,
  label,
  section,
  input: 'spacing',
  helperText,
  example,
});

const length = (
  key: string,
  property: string,
  label: string,
  section: StyleSection,
  min: number,
  max: number,
  step = 1,
  helperText?: string,
  example?: string
): StyleFieldSpec => ({
  key,
  property,
  label,
  section,
  input: 'length',
  min,
  max,
  step,
  unit: 'px',
  helperText,
  example,
});

const backgroundImage = (
  key: string,
  property: string,
  label: string,
  section: StyleSection,
  helperText?: string,
  example?: string
): StyleFieldSpec => ({
  key,
  property,
  label,
  section,
  input: 'background-image',
  helperText,
  example,
});

const borderColorField = (
  key: string,
  property: string,
  label: string,
  section: StyleSection,
  helperText?: string
): StyleFieldSpec => ({
  key,
  property,
  label,
  section,
  input: 'color',
  valueMode: 'border-color',
  helperText,
});

export const GLOBAL_STYLE_FIELDS: GlobalStyleFieldSpec[] = [
  {
    selector: 'container',
    ...color(
      'page-background-color',
      'background-color',
      '页面背景色',
      'Color / Background',
      '整页最外层的底色。',
      '#ffffff'
    ),
  },
  {
    selector: 'container',
    ...backgroundImage(
      'page-background-image',
      'background-image',
      '页面背景图',
      'Color / Background',
      '可填入渐变、远程 URL 或上传本地图。会显示在整页背景层。',
      'linear-gradient(135deg, #f5f3ff, #fff7ed)'
    ),
  },
  {
    selector: 'container',
    ...length(
      'page-max-width',
      'max-width',
      '页面最大宽度',
      'Spacing',
      480,
      1200,
      10,
      '文章内容区的最大宽度。',
      '840px'
    ),
  },
  {
    selector: 'container',
    ...spacing(
      'page-padding',
      'padding',
      '页面内边距',
      'Spacing',
      '四个值分别是上、右、下、左。两值写法表示上下、左右。',
      '24px 20px 48px 20px'
    ),
  },
  {
    selector: 'container',
    ...fontFamily(
      'global-font-family',
      'font-family',
      '全局字体',
      'Typography',
      '优先选择公众号和系统原生可用字体。'
    ),
  },
  {
    selector: 'container',
    ...fontSize(
      'global-font-size',
      'font-size',
      '全局字号',
      'Typography',
      12,
      24,
      1,
      '正文基础字号。'
    ),
    valueMode: 'multi-target',
    targets: [
      { selector: 'container', property: 'font-size' },
      { selector: 'p', property: 'font-size' },
      { selector: 'li', property: 'font-size' },
      { selector: 'blockquote', property: 'font-size' },
      { selector: 'td', property: 'font-size' },
      { selector: 'th', property: 'font-size' },
    ],
  },
  {
    selector: 'container',
    ...lineHeight(
      'global-line-height',
      'line-height',
      '全局行高',
      'Typography',
      '越大越疏朗，适合长文阅读。'
    ),
    valueMode: 'multi-target',
    targets: [
      { selector: 'container', property: 'line-height' },
      { selector: 'p', property: 'line-height' },
      { selector: 'li', property: 'line-height' },
      { selector: 'blockquote', property: 'line-height' },
      { selector: 'code', property: 'line-height' },
      { selector: 'pre', property: 'line-height' },
      { selector: 'td', property: 'line-height' },
      { selector: 'th', property: 'line-height' },
    ],
  },
  {
    selector: 'container',
    key: 'global-body-color',
    property: 'color',
    label: '基础文字颜色',
    section: 'Color / Background',
    input: 'color',
    valueMode: 'multi-target',
    targets: [
      { selector: 'p', property: 'color' },
      { selector: 'li', property: 'color' },
      { selector: 'blockquote', property: 'color' },
      { selector: 'td', property: 'color' },
      { selector: 'th', property: 'color' },
    ],
    helperText: '作用于正文、列表、引用和表格文本，比“容器默认颜色”更直观。',
    example: '#333333',
  },
  {
    selector: 'p',
    ...spacing(
      'paragraph-margin',
      'margin',
      '正文段距',
      'Spacing',
      '控制段落上下留白。',
      '18px 0'
    ),
  },
];

const BORDER_HELPER = '粗细 样式 颜色。样式可选：solid / dashed / dotted / double。';
const BORDER_COLOR_HELPER = '单独调整颜色，支持透明度。';

export const TEMPLATE_STYLE_CATALOG: SelectorStyleCatalog[] = [
  {
    selector: 'container',
    label: '页面容器',
    fields: [
      fontFamily('container-font-family', 'font-family', '字体', 'Typography', '默认会影响整页阅读气质。'),
      {
        ...fontSize('container-font-size', 'font-size', '字号', 'Typography', 12, 24, 1, '整页基础字号。'),
        valueMode: 'multi-target',
        targets: [
          { selector: 'container', property: 'font-size' },
          { selector: 'p', property: 'font-size' },
          { selector: 'li', property: 'font-size' },
          { selector: 'blockquote', property: 'font-size' },
          { selector: 'td', property: 'font-size' },
          { selector: 'th', property: 'font-size' },
        ],
      },
      {
        ...lineHeight('container-line-height', 'line-height', '行高', 'Typography', '整页基础行高。'),
        valueMode: 'multi-target',
        targets: [
          { selector: 'container', property: 'line-height' },
          { selector: 'p', property: 'line-height' },
          { selector: 'li', property: 'line-height' },
          { selector: 'blockquote', property: 'line-height' },
          { selector: 'code', property: 'line-height' },
          { selector: 'pre', property: 'line-height' },
          { selector: 'td', property: 'line-height' },
          { selector: 'th', property: 'line-height' },
        ],
      },
      {
        key: 'container-body-color',
        property: 'color',
        label: '基础文字颜色',
        section: 'Color / Background',
        input: 'color',
        valueMode: 'multi-target',
        targets: [
          { selector: 'container', property: 'color' },
          { selector: 'p', property: 'color' },
          { selector: 'li', property: 'color' },
          { selector: 'blockquote', property: 'color' },
          { selector: 'td', property: 'color' },
          { selector: 'th', property: 'color' },
        ],
        helperText: '作用于正文、列表、引用和表格文本。',
        example: '#333333',
      },
      color('container-background-color', 'background-color', '背景色', 'Color / Background', '页面容器底色。', '#ffffff'),
      backgroundImage('container-background-image', 'background-image', '背景图', 'Color / Background', '支持渐变、远程 URL 和本地上传图片。'),
      length('container-border-radius', 'border-radius', '圆角', 'Color / Background', 0, 48, 1, '容器圆角，配合背景色或背景图使用效果更佳。', '0'),
      text('container-margin', 'margin', '外边距', 'Spacing', '0 auto', '常见写法是 0 auto，用来让文章居中。', '0 auto'),
      spacing('container-padding', 'padding', '内边距', 'Spacing', '四值顺序：上、右、下、左。', '24px 20px 48px 20px'),
      {
        ...spacing('container-paragraph-margin', 'margin', '正文段距', 'Spacing', '控制正文段落上下留白。', '18px 0'),
        valueMode: 'multi-target',
        targets: [{ selector: 'p', property: 'margin' }],
      },
      length('container-max-width', 'max-width', '最大宽度', 'Spacing', 480, 1200, 10, '内容区域最大宽度。', '840px'),
      select(
        'container-word-wrap',
        'word-wrap',
        '换行策略',
        'Effects',
        ['normal', 'break-word', 'anywhere'],
        '长链接或超长单词如何换行。一般使用 break-word。',
        'break-word'
      ),
    ],
  },
  {
    selector: 'h1',
    label: 'H1 标题',
    fields: [
      fontFamily('h1-font-family', 'font-family', '标题字体', 'Typography', '可单独选择与正文不同的字体。'),
      fontSize('h1-font-size', 'font-size', '字号', 'Typography', 20, 56, 1, '主标题字号。'),
      text('h1-font-weight', 'font-weight', '字重', 'Typography', '700', '常见值：500 / 600 / 700。', '700'),
      lineHeight('h1-line-height', 'line-height', '行高', 'Typography', '标题建议略紧凑。'),
      text('h1-letter-spacing', 'letter-spacing', '字距', 'Typography', '-0.02em', '可微调标题松紧。', '-0.02em'),
      select('h1-text-align', 'text-align', '对齐方式', 'Typography', ['left', 'center', 'right'], '控制标题左对齐、居中或右对齐。'),
      select('h1-text-transform', 'text-transform', '大小写转换', 'Typography', ['', 'uppercase', 'lowercase', 'capitalize'], '英文标题大小写风格。'),
      select('h1-font-variant', 'font-variant', '字体变体', 'Typography', ['', 'small-caps'], '英文标题的小型大写效果。'),
      color('h1-color', 'color', '文字颜色', 'Color / Background', 'H1 的文字颜色。'),
      color('h1-background-color', 'background-color', '背景色', 'Color / Background', '可做荧光笔、高亮条或标题底色。'),
      spacing('h1-margin', 'margin', '外边距', 'Spacing', '控制标题上下留白。', '38px 0 16px'),
      spacing('h1-padding', 'padding', '内边距', 'Spacing', '四值顺序：上、右、下、左。底部留白配合底边框，左侧留白配合左边框。', '0'),
      text('h1-border-top', 'border-top', '顶边框', 'Border / Radius', 'none', BORDER_HELPER, '2px solid #000'),
      borderColorField('h1-border-top-color', 'border-top', '顶边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      text('h1-border-right', 'border-right', '右边框', 'Border / Radius', 'none', BORDER_HELPER, '2px solid #000'),
      borderColorField('h1-border-right-color', 'border-right', '右边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      text('h1-border-bottom', 'border-bottom', '底边框', 'Border / Radius', 'none', BORDER_HELPER, '2px solid #000'),
      borderColorField('h1-border-bottom-color', 'border-bottom', '底边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      text('h1-border-left', 'border-left', '左边框', 'Border / Radius', 'none', BORDER_HELPER, '2px solid #000'),
      borderColorField('h1-border-left-color', 'border-left', '左边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      length('h1-border-radius', 'border-radius', '圆角', 'Border / Radius', 0, 999, 1, '配合背景色做标签/胶囊标题。', '0'),
      text('h1-text-shadow', 'text-shadow', '文字阴影', 'Effects', '0 1px 2px rgba(0,0,0,0.12)', '可增加层次感。', '0 1px 2px rgba(0,0,0,0.12)'),
    ],
  },
  {
    selector: 'h2',
    label: 'H2 标题',
    fields: [
      fontFamily('h2-font-family', 'font-family', '标题字体', 'Typography', '可单独选择与正文不同的字体。'),
      fontSize('h2-font-size', 'font-size', '字号', 'Typography', 18, 42, 1, '二级标题字号。'),
      text('h2-font-weight', 'font-weight', '字重', 'Typography', '600', '常见值：500 / 600 / 700。', '600'),
      lineHeight('h2-line-height', 'line-height', '行高', 'Typography', '标题建议略紧凑。'),
      text('h2-letter-spacing', 'letter-spacing', '字距', 'Typography', '0', '可微调标题松紧。', '0'),
      select('h2-text-align', 'text-align', '对齐方式', 'Typography', ['left', 'center', 'right'], '控制标题左对齐、居中或右对齐。'),
      color('h2-color', 'color', '文字颜色', 'Color / Background'),
      color('h2-background-color', 'background-color', '背景色', 'Color / Background', '可做荧光笔、高亮条或标题底色。'),
      spacing('h2-margin', 'margin', '外边距', 'Spacing', '控制标题上下留白。', '32px 0 16px'),
      spacing('h2-padding', 'padding', '内边距', 'Spacing', '四值顺序：上、右、下、左。底部留白配合底边框，左侧留白配合左边框。', '0'),
      text('h2-border-top', 'border-top', '顶边框', 'Border / Radius', 'none', BORDER_HELPER, '2px solid #000'),
      borderColorField('h2-border-top-color', 'border-top', '顶边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      text('h2-border-right', 'border-right', '右边框', 'Border / Radius', 'none', BORDER_HELPER, '2px solid #000'),
      borderColorField('h2-border-right-color', 'border-right', '右边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      text('h2-border-bottom', 'border-bottom', '底边框', 'Border / Radius', 'none', BORDER_HELPER, '2px solid #000'),
      borderColorField('h2-border-bottom-color', 'border-bottom', '底边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      text('h2-border-left', 'border-left', '左边框', 'Border / Radius', 'none', BORDER_HELPER, '2px solid #000'),
      borderColorField('h2-border-left-color', 'border-left', '左边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      length('h2-border-radius', 'border-radius', '圆角', 'Border / Radius', 0, 999, 1, '配合背景色做标签/胶囊标题。', '0'),
      text('h2-text-shadow', 'text-shadow', '文字阴影', 'Effects', '0 1px 2px rgba(0,0,0,0.12)'),
    ],
  },
  {
    selector: 'h3',
    label: 'H3 标题',
    fields: [
      fontFamily('h3-font-family', 'font-family', '标题字体', 'Typography', '可单独选择与正文不同的字体。'),
      fontSize('h3-font-size', 'font-size', '字号', 'Typography', 16, 34, 1),
      text('h3-font-weight', 'font-weight', '字重', 'Typography', '600'),
      lineHeight('h3-line-height', 'line-height', '行高', 'Typography'),
      text('h3-letter-spacing', 'letter-spacing', '字距', 'Typography', '0', '可微调标题松紧。', '0'),
      select('h3-text-align', 'text-align', '对齐方式', 'Typography', ['left', 'center', 'right'], '控制标题左对齐、居中或右对齐。'),
      color('h3-color', 'color', '文字颜色', 'Color / Background'),
      color('h3-background-color', 'background-color', '背景色', 'Color / Background', '可做荧光笔、高亮条或标题底色。'),
      spacing('h3-margin', 'margin', '外边距', 'Spacing', undefined, '28px 0 14px'),
      spacing('h3-padding', 'padding', '内边距', 'Spacing', '四值顺序：上、右、下、左。底部留白配合底边框，左侧留白配合左边框。', '0'),
      text('h3-border-top', 'border-top', '顶边框', 'Border / Radius', 'none', BORDER_HELPER, '2px solid #000'),
      borderColorField('h3-border-top-color', 'border-top', '顶边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      text('h3-border-right', 'border-right', '右边框', 'Border / Radius', 'none', BORDER_HELPER, '2px solid #000'),
      borderColorField('h3-border-right-color', 'border-right', '右边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      text('h3-border-bottom', 'border-bottom', '底边框', 'Border / Radius', 'none', BORDER_HELPER, '2px solid #000'),
      borderColorField('h3-border-bottom-color', 'border-bottom', '底边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      text('h3-border-left', 'border-left', '左边框', 'Border / Radius', 'none', BORDER_HELPER, '2px solid #000'),
      borderColorField('h3-border-left-color', 'border-left', '左边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      length('h3-border-radius', 'border-radius', '圆角', 'Border / Radius', 0, 999, 1, '配合背景色做标签/胶囊标题。', '0'),
      text('h3-text-shadow', 'text-shadow', '文字阴影', 'Effects', '0 1px 2px rgba(0,0,0,0.12)'),
    ],
  },
  {
    selector: 'h4',
    label: 'H4 标题',
    fields: [
      fontFamily('h4-font-family', 'font-family', '标题字体', 'Typography', '可单独选择与正文不同的字体。'),
      fontSize('h4-font-size', 'font-size', '字号', 'Typography', 14, 28, 1),
      text('h4-font-weight', 'font-weight', '字重', 'Typography', '600'),
      lineHeight('h4-line-height', 'line-height', '行高', 'Typography'),
      text('h4-letter-spacing', 'letter-spacing', '字距', 'Typography', '0', '可微调标题松紧。', '0'),
      select('h4-text-align', 'text-align', '对齐方式', 'Typography', ['left', 'center', 'right'], '控制标题左对齐、居中或右对齐。'),
      color('h4-color', 'color', '文字颜色', 'Color / Background'),
      color('h4-background-color', 'background-color', '背景色', 'Color / Background', '可做荧光笔、高亮条或标题底色。'),
      spacing('h4-margin', 'margin', '外边距', 'Spacing', undefined, '24px 0 12px'),
      spacing('h4-padding', 'padding', '内边距', 'Spacing', '四值顺序：上、右、下、左。底部留白配合底边框，左侧留白配合左边框。', '0'),
      text('h4-border-top', 'border-top', '顶边框', 'Border / Radius', 'none', BORDER_HELPER, '2px solid #000'),
      borderColorField('h4-border-top-color', 'border-top', '顶边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      text('h4-border-right', 'border-right', '右边框', 'Border / Radius', 'none', BORDER_HELPER, '2px solid #000'),
      borderColorField('h4-border-right-color', 'border-right', '右边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      text('h4-border-bottom', 'border-bottom', '底边框', 'Border / Radius', 'none', BORDER_HELPER, '2px solid #000'),
      borderColorField('h4-border-bottom-color', 'border-bottom', '底边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      text('h4-border-left', 'border-left', '左边框', 'Border / Radius', 'none', BORDER_HELPER, '2px solid #000'),
      borderColorField('h4-border-left-color', 'border-left', '左边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      length('h4-border-radius', 'border-radius', '圆角', 'Border / Radius', 0, 999, 1, '配合背景色做标签/胶囊标题。', '0'),
      text('h4-text-shadow', 'text-shadow', '文字阴影', 'Effects', '0 1px 2px rgba(0,0,0,0.12)'),
    ],
  },
  {
    selector: 'p',
    label: '正文段落',
    fields: [
      fontSize('p-font-size', 'font-size', '字号', 'Typography', 12, 24, 1),
      lineHeight('p-line-height', 'line-height', '行高', 'Typography'),
      color('p-color', 'color', '文字颜色', 'Color / Background'),
      color('p-background-color', 'background-color', '背景色', 'Color / Background', '适合做正文高亮、重点句底色。'),
      spacing('p-margin', 'margin', '外边距', 'Spacing', '一般写成“上下 左右”。', '18px 0'),
    ],
  },
  {
    selector: 'strong',
    label: '加粗文本',
    fields: [
      text('strong-font-weight', 'font-weight', '字重', 'Typography', '700'),
      color('strong-color', 'color', '文字颜色', 'Color / Background'),
      color('strong-background-color', 'background-color', '背景色', 'Color / Background'),
      spacing('strong-padding', 'padding', '内边距', 'Spacing', undefined, '0 4px'),
      length('strong-border-radius', 'border-radius', '圆角', 'Border / Radius', 0, 24, 1, undefined, '4px'),
      text('strong-text-shadow', 'text-shadow', '文字阴影', 'Effects', 'none'),
    ],
  },
  {
    selector: 'em',
    label: '倾斜文本',
    fields: [
      select('em-font-style', 'font-style', '字体样式', 'Typography', ['', 'italic', 'normal'], '一般使用 italic。'),
      color('em-color', 'color', '文字颜色', 'Color / Background'),
      color('em-background-color', 'background-color', '背景色', 'Color / Background', '可给倾斜强调文字加柔和底色。'),
    ],
  },
  {
    selector: 'u',
    label: '下划线文本',
    fields: [
      color('u-color', 'color', '文字颜色', 'Color / Background', '下划线文字本身的颜色。'),
      color('u-background-color', 'background-color', '背景色', 'Color / Background', '可与下划线叠加，形成更明显的强调样式。'),
      select('u-text-decoration-style', 'text-decoration-style', '下划线样式', 'Typography', ['', 'solid', 'dashed', 'dotted'], '普通实线、虚线、点线下划线。'),
      color('u-text-decoration-color', 'text-decoration-color', '下划线颜色', 'Color / Background', '可单独设置线的颜色。'),
      length('u-text-underline-offset', 'text-underline-offset', '下划线偏移', 'Typography', 0, 12, 1, '下划线离文字的距离。', '2px'),
    ],
  },
  {
    selector: 'a',
    label: '链接',
    fields: [
      color('a-color', 'color', '文字颜色', 'Color / Background'),
      color('a-background-color', 'background-color', '背景色', 'Color / Background', '适合做按钮感链接或高亮链接。'),
      select('a-text-decoration', 'text-decoration', '装饰线', 'Typography', ['', 'none', 'underline', 'line-through'], '控制下划线、删除线等效果。'),
      select('a-text-decoration-style', 'text-decoration-style', '下划线样式', 'Typography', ['', 'solid', 'dashed', 'dotted'], '用于链接的下划线样式。普通 Markdown 下划线语义并不存在，如果要给普通文本加下划线，可写 <u>文本</u>。'),
      color('a-text-decoration-color', 'text-decoration-color', '装饰线颜色', 'Color / Background'),
      length('a-text-underline-offset', 'text-underline-offset', '下划线偏移', 'Typography', 0, 12, 1, '下划线离文字有多远。', '2px'),
      text('a-border-bottom', 'border-bottom', '底边框', 'Border / Radius', '1px solid currentColor'),
      length('a-padding-bottom', 'padding-bottom', '底部内边距', 'Spacing', 0, 20, 1, undefined, '1px'),
    ],
  },
  {
    selector: 'ul',
    label: '无序列表',
    fields: [
      spacing('ul-margin', 'margin', '外边距', 'Spacing', undefined, '16px 0'),
      length('ul-padding-left', 'padding-left', '左侧缩进', 'Spacing', 0, 60, 1, '项目符号离正文有多远。', '28px'),
    ],
  },
  {
    selector: 'ol',
    label: '有序列表',
    fields: [
      spacing('ol-margin', 'margin', '外边距', 'Spacing', undefined, '16px 0'),
      length('ol-padding-left', 'padding-left', '左侧缩进', 'Spacing', 0, 60, 1, undefined, '28px'),
    ],
  },
  {
    selector: 'li',
    label: '列表项',
    fields: [
      fontSize('li-font-size', 'font-size', '字号', 'Typography', 12, 24, 1, '不设置则跟随全局字号。'),
      color('li-color', 'color', '文字颜色', 'Color / Background'),
      color('li-background-color', 'background-color', '背景色', 'Color / Background', '可给单条列表项加底色突出重点。'),
      lineHeight('li-line-height', 'line-height', '行高', 'Typography'),
      spacing('li-margin', 'margin', '外边距', 'Spacing', undefined, '8px 0'),
    ],
  },
  {
    selector: 'blockquote',
    label: '引用块',
    fields: [
      fontFamily('blockquote-font-family', 'font-family', '字体', 'Typography', '可独立于正文使用不同字体。'),
      fontSize('blockquote-font-size', 'font-size', '字号', 'Typography', 12, 24, 1, '不设置则跟随全局字号。'),
      lineHeight('blockquote-line-height', 'line-height', '行高', 'Typography', '引用块内部独立行距。'),
      select('blockquote-font-style', 'font-style', '字体样式', 'Typography', ['', 'italic', 'normal']),
      select('blockquote-text-align', 'text-align', '文字对齐', 'Typography', ['', 'left', 'center', 'right', 'justify']),
      color('blockquote-color', 'color', '文字颜色', 'Color / Background', '会同步作用到引用块内部段落文本。'),
      color('blockquote-background-color', 'background-color', '背景色', 'Color / Background'),
      spacing('blockquote-margin', 'margin', '外边距', 'Spacing', undefined, '24px 0'),
      spacing('blockquote-padding', 'padding', '内边距', 'Spacing', undefined, '16px 20px'),
      text('blockquote-border-top', 'border-top', '上边框', 'Border / Radius', BORDER_HELPER),
      text('blockquote-border-right', 'border-right', '右边框', 'Border / Radius', BORDER_HELPER),
      text('blockquote-border-bottom', 'border-bottom', '下边框', 'Border / Radius', BORDER_HELPER),
      text('blockquote-border-left', 'border-left', '左边框', 'Border / Radius', '4px solid #0066cc'),
      borderColorField('blockquote-border-left-color', 'border-left', '左边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      length('blockquote-border-radius', 'border-radius', '圆角', 'Border / Radius', 0, 32, 1, undefined, '8px'),
      select('blockquote-overflow-x', 'overflow-x', '横向溢出', 'Effects', ['auto', 'scroll', 'hidden'], '内容过宽时如何横向滚动。auto 仅在溢出时显示滚动条。', 'auto'),
      text('blockquote-box-shadow', 'box-shadow', '阴影', 'Effects', '0 2px 12px rgba(0,0,0,0.06)', '卡片式悬浮效果。'),
      select('blockquote-decoration', '--bq-decoration', '装饰框', 'Effects', ['', 'corner-frame'], '选择 corner-frame 启用直角装饰框模式。清空恢复普通样式。'),
      color('blockquote-corner-color', '--bq-corner-color', '装饰框颜色', 'Effects', '直角装饰框的线条颜色。'),
    ],
  },
  {
    selector: 'code',
    label: '行内代码',
    fields: [
      fontFamily('code-font-family', 'font-family', '字体', 'Typography', '建议使用等宽字体。'),
      fontSize('code-font-size', 'font-size', '字号', 'Typography', 10, 24, 1),
      lineHeight('code-line-height', 'line-height', '行高', 'Typography'),
      color('code-color', 'color', '文字颜色', 'Color / Background'),
      color('code-background-color', 'background-color', '背景色', 'Color / Background'),
      spacing('code-padding', 'padding', '内边距', 'Spacing', undefined, '3px 6px'),
      text('code-border', 'border', '边框', 'Border / Radius', '1px solid rgba(0,0,0,0.08)'),
      length('code-border-radius', 'border-radius', '圆角', 'Border / Radius', 0, 24, 1, undefined, '4px'),
    ],
  },
  {
    selector: 'pre',
    label: '代码块',
    fields: [
      fontFamily('pre-font-family', 'font-family', '字体', 'Typography', '建议使用等宽字体。'),
      fontSize('pre-font-size', 'font-size', '字号', 'Typography', 10, 24, 1),
      lineHeight('pre-line-height', 'line-height', '行高', 'Typography'),
      color('pre-color', 'color', '代码文字颜色', 'Color / Background', '设置后，代码块内部会优先使用这组颜色。'),
      color('pre-background-color', 'background-color', '背景色', 'Color / Background', '代码块整体背景色。'),
      spacing('pre-margin', 'margin', '外边距', 'Spacing', undefined, '24px 0'),
      spacing('pre-padding', 'padding', '内边距', 'Spacing', undefined, '20px'),
      select('pre-overflow-x', 'overflow-x', '横向溢出', 'Effects', ['auto', 'scroll', 'hidden'], '代码过长时如何横向滚动。', 'auto'),
      text('pre-border-top', 'border-top', '上边框', 'Border / Radius', BORDER_HELPER),
      text('pre-border-right', 'border-right', '右边框', 'Border / Radius', BORDER_HELPER),
      text('pre-border-bottom', 'border-bottom', '下边框', 'Border / Radius', BORDER_HELPER),
      text('pre-border-left', 'border-left', '左边框', 'Border / Radius', '4px solid #0066cc'),
      borderColorField('pre-border-left-color', 'border-left', '左边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      length('pre-border-radius', 'border-radius', '圆角', 'Border / Radius', 0, 32, 1, undefined, '8px'),
      text('pre-box-shadow', 'box-shadow', '阴影', 'Effects', '0 4px 20px rgba(0,0,0,0.08)', '浮动卡片效果。'),
    ],
  },
  {
    selector: 'hr',
    label: '分隔线',
    fields: [
      // ── 普通模式 ──
      color('hr-background-color', 'background-color', '线条颜色', 'Color / Background', '【普通模式】纯色线条的颜色。使用渐变时会被覆盖；使用装饰模式时无效。'),
      text('hr-background', 'background', '渐变背景', 'Color / Background', 'linear-gradient(...)', '【普通模式】设置后覆盖线条颜色。清空可恢复纯色。'),
      spacing('hr-margin', 'margin', '外边距', 'Spacing', '上下控制间距，左右控制线条缩进（如 36px 60px 即上下36px、左右各缩进60px）。', '36px auto'),
      length('hr-height', 'height', '高度', 'Spacing', 1, 20, 1, '【普通模式】线条粗细。使用点线/虚线时应为 0。', '1px'),
      text('hr-border-top', 'border-top', '线条边框', 'Spacing', '2px dashed #ccc', '【普通模式】点线/虚线/双线。如 2px dotted #aaa、2px dashed #bbb。使用时需将高度设为 0。'),
      text('hr-opacity', 'opacity', '不透明度', 'Effects', '1', '0 完全透明，1 完全不透明。两种模式通用。', '0.5'),
      text('hr-box-shadow', 'box-shadow', '阴影', 'Effects', '0 2px 8px rgba(0,0,0,0.1)', '柔和投影或发光效果。两种模式通用。'),
      // ── 装饰模式 ──
      select('hr-symbol', '--hr-symbol', '装饰符号', 'Effects', ['', '●', '◆', '◇', '★', '○', '✦', '■', '● ● ●', '◆ ◆ ◆', '■ ■ ■'], '【装饰模式】选择符号后启用"线—符号—线"模式。选空值恢复普通线条。'),
      select('hr-symbol-position', '--hr-symbol-position', '符号位置', 'Effects', ['center', 'sides'], '【装饰模式】center：线—符号—线。sides：符号—线—符号。'),
      text('hr-symbol-size', '--hr-symbol-size', '符号大小', 'Effects', '10px', '【装饰模式】装饰符号的字号。', '10px'),
      color('hr-symbol-color', '--hr-symbol-color', '符号颜色', 'Effects', '【装饰模式】装饰符号的颜色。'),
      color('hr-line-color', '--hr-line-color', '装饰线颜色', 'Effects', '【装饰模式】两侧线条的颜色。'),
      text('hr-gap', '--hr-gap', '符号间距', 'Effects', '16px', '【装饰模式】符号与两侧线条之间的间距。', '16px'),
      text('hr-line-thickness', '--hr-line-thickness', '装饰线粗细', 'Effects', '1px', '【装饰模式】两侧线条的粗细。', '1px'),
    ],
  },
  {
    selector: 'img',
    label: '图片',
    fields: [
      select('img-display', 'display', '显示方式', 'Effects', ['block', 'inline-block'], '图片一般建议使用 block。'),
      select('img-grid-mode', '--img-grid-mode', '多图模式', 'Effects', ['grid', 'carousel'], 'grid：双图并列。carousel：横向滑动轮播。保存模板后在编辑器中生效。'),
      text('img-max-width', 'max-width', '最大宽度', 'Spacing', '100%', '支持百分比（如 66%）或像素值（如 400px）。', '66%'),
      text('img-height', 'height', '高度', 'Spacing', 'auto', '一般保持 auto，避免拉伸变形。', 'auto'),
      spacing('img-margin', 'margin', '外边距', 'Spacing', undefined, '30px auto'),
      spacing('img-padding', 'padding', '内边距', 'Spacing', '图片与外框之间的间距。设为 0 则无间距。', '0'),
      color('img-background-color', 'background-color', '背景色', 'Color / Background', '内边距区域的背景色。可做为图片的外框颜色。默认透明。'),
      length('img-border-radius', 'border-radius', '圆角', 'Border / Radius', 0, 48, 1, undefined, '14px'),
      text('img-border', 'border', '外框边框', 'Border / Radius', 'none', '图片外框的边框样式。如 1px solid rgba(0,0,0,0.1)。'),
      text('img-box-shadow', 'box-shadow', '阴影', 'Effects', 'none', '图片的阴影效果。如 0 4px 12px rgba(0,0,0,0.1)。'),
    ],
  },
  {
    selector: 'table',
    label: '表格',
    fields: [
      text('table-width', 'width', '宽度', 'Spacing', '100%', '常见写法是 100%。', '100%'),
      spacing('table-margin', 'margin', '外边距', 'Spacing', undefined, '24px 0'),
      fontSize('table-font-size', 'font-size', '字号', 'Typography', 10, 24, 1),
      select('table-border-collapse', 'border-collapse', '边框折叠', 'Effects', ['collapse', 'separate'], '一般使用 collapse。'),
      text('table-border', 'border', '外框边框', 'Border / Radius', '1px solid #e0e0e0', '表格最外层边框。与单元格边框独立，可设不同粗细和颜色。'),
      borderColorField('table-border-color', 'border', '外框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
    ],
  },
  {
    selector: 'th',
    label: '表头单元格',
    fields: [
      fontSize('th-font-size', 'font-size', '字号', 'Typography', 10, 24, 1, '不设置则跟随全局字号。'),
      text('th-font-weight', 'font-weight', '字重', 'Typography', '600'),
      color('th-color', 'color', '文字颜色', 'Color / Background'),
      color('th-background-color', 'background-color', '背景色', 'Color / Background'),
      spacing('th-padding', 'padding', '内边距', 'Spacing', undefined, '12px 16px'),
      text('th-border', 'border', '边框', 'Border / Radius', '1px solid #e0e0e0', '四边统一的边框样式。'),
      borderColorField('th-border-color', 'border', '边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      text('th-border-bottom', 'border-bottom', '底部边框', 'Border / Radius', '2px solid #999', '单独控制表头底线，可加粗或换色以区分表头与表体。'),
      borderColorField('th-border-bottom-color', 'border-bottom', '底部边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      select('th-text-align', 'text-align', '文本对齐', 'Typography', ['left', 'center', 'right']),
    ],
  },
  {
    selector: 'td',
    label: '表格单元格',
    fields: [
      fontSize('td-font-size', 'font-size', '字号', 'Typography', 10, 24, 1, '不设置则跟随全局字号。'),
      color('td-color', 'color', '文字颜色', 'Color / Background'),
      text('td-font-weight', 'font-weight', '字重', 'Typography', '400'),
      spacing('td-padding', 'padding', '内边距', 'Spacing', undefined, '12px 16px'),
      text('td-border', 'border', '边框', 'Border / Radius', '1px solid #e0e0e0', '四边统一的边框样式。'),
      borderColorField('td-border-color', 'border', '边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
      text('td-border-bottom', 'border-bottom', '底部边框', 'Border / Radius', '1px solid #e0e0e0', '单独控制单元格底线。留空则跟随上方边框设置。'),
      borderColorField('td-border-bottom-color', 'border-bottom', '底部边框颜色', 'Border / Radius', BORDER_COLOR_HELPER),
    ],
  },
];

export const SELECTOR_LABELS = {
  ...Object.fromEntries(TEMPLATE_STYLE_CATALOG.map((catalog) => [catalog.selector, catalog.label])),
  tr: '表格行',
} as Record<TemplateSelector, string>;

export const SELECTOR_DESCRIPTIONS: Record<TemplateSelector, string> = {
  container: '整篇文章最外层的容器，控制页面宽度、整体留白、默认字体与页面底色。',
  h1: '文章一级标题，通常用于文章主标题或最重要的大标题。',
  h2: '文章二级标题，常用于章节标题。',
  h3: '文章三级标题，适合章节内的小标题。',
  h4: '文章四级标题，适合补充说明类小标题。',
  p: '最常见的正文段落，绝大多数文字内容都会走这里。',
  strong: '加粗强调文字，对应 Markdown 的 **文本**。',
  em: '倾斜强调文字，对应 Markdown 的 *文本*。',
  u: '普通下划线文字，对应你现在支持的 ++文本++ 或直接写 <u>文本</u>。',
  a: '超链接文字，对应 Markdown 的 [文本](链接)。',
  ul: '无序列表整体容器，对应 Markdown 的 - 列表。',
  ol: '有序列表整体容器，对应 Markdown 的 1. 列表。',
  li: '列表中的每一条项目内容。',
  blockquote: '引用块，对应 Markdown 的 > 引用内容。',
  code: '行内代码，对应 Markdown 的 `code`。',
  pre: '代码块，对应 Markdown 的 ```code block```。',
  hr: '分隔线，对应 Markdown 的 ---。',
  img: '文章中的图片显示样式。',
  table: '整个表格容器。',
  th: '表头单元格。',
  td: '普通表格单元格。',
  tr: '表格行。当前大多数行样式会由 table / th / td 一起决定，所以一般不需要单独改它。',
};

export interface HeadingPreset {
  label: string;
  description: string;
  styles: StyleDeclaration;
}

export const HEADING_PRESETS: HeadingPreset[] = [
  {
    label: '简约底线',
    description: '干净的底部线条，经典且专业。',
    styles: {
      'font-weight': '700',
      'color': '',
      'padding': '0 0 10px 0',
      'border-top': '',
      'border-right': '',
      'border-bottom': '2px solid #1d1d1f',
      'border-left': '',
      'border-radius': '',
      'background-color': '',
      'text-shadow': '',
      'text-transform': '',
      'letter-spacing': '',
    },
  },
  {
    label: '左侧色条',
    description: '左侧强调色条，层次分明。',
    styles: {
      'font-weight': '700',
      'color': '',
      'padding': '0 0 0 14px',
      'border-top': '',
      'border-right': '',
      'border-bottom': '',
      'border-left': '4px solid #0066cc',
      'border-radius': '',
      'background-color': '',
      'text-shadow': '',
      'text-transform': '',
      'letter-spacing': '',
    },
  },
  {
    label: '渐变底色',
    description: '柔和渐变背景 + 圆角，现代感。',
    styles: {
      'font-weight': '700',
      'color': '',
      'padding': '12px 18px',
      'border-radius': '12px',
      'border-top': '',
      'border-right': '',
      'border-bottom': '',
      'border-left': '',
      'background-color': 'rgba(0,102,204,0.08)',
      'text-shadow': '',
      'text-transform': '',
      'letter-spacing': '',
    },
  },
  {
    label: '标签胶囊',
    description: '胶囊形标签，醒目紧凑。',
    styles: {
      'font-weight': '700',
      'color': '#ffffff',
      'padding': '8px 24px',
      'border-radius': '999px',
      'border-top': '',
      'border-right': '',
      'border-bottom': '',
      'border-left': '',
      'background-color': '#1d1d1f',
      'text-shadow': '',
      'text-transform': '',
      'letter-spacing': '',
    },
  },
  {
    label: '大写粗体',
    description: '大写 + 宽字距，杂志封面式风格。',
    styles: {
      'font-weight': '800',
      'color': '',
      'text-transform': 'uppercase',
      'letter-spacing': '0.12em',
      'padding': '',
      'border-top': '',
      'border-right': '',
      'border-bottom': '',
      'border-left': '',
      'border-radius': '',
      'background-color': '',
      'text-shadow': '',
    },
  },
  {
    label: '阴影浮动',
    description: '文字投影增加层次感和立体感。',
    styles: {
      'font-weight': '700',
      'color': '',
      'text-shadow': '0 3px 6px rgba(0,0,0,0.12)',
      'padding': '',
      'border-top': '',
      'border-right': '',
      'border-bottom': '',
      'border-left': '',
      'border-radius': '',
      'background-color': '',
      'text-transform': '',
      'letter-spacing': '',
    },
  },
  {
    label: '居中装饰',
    description: '居中 + 短底线，仪式感强。',
    styles: {
      'font-weight': '700',
      'color': '',
      'text-align': 'center',
      'padding': '0 0 14px 0',
      'border-top': '',
      'border-right': '',
      'border-bottom': '3px solid #0066cc',
      'border-left': '',
      'border-radius': '',
      'background-color': '',
      'text-shadow': '',
      'text-transform': '',
      'letter-spacing': '',
    },
  },
  {
    label: '极简留白',
    description: '纤细字重 + 大字距，靠留白呼吸。',
    styles: {
      'font-weight': '300',
      'color': '',
      'letter-spacing': '0.04em',
      'padding': '',
      'border-top': '',
      'border-right': '',
      'border-bottom': '',
      'border-left': '',
      'border-radius': '',
      'background-color': '',
      'text-shadow': '',
      'text-transform': '',
    },
  },
];

export interface HrPreset {
  label: string;
  description: string;
  styles: StyleDeclaration;
}

const HR_CLEAR_SYMBOL: StyleDeclaration = {
  '--hr-symbol': '',
  '--hr-symbol-position': '',
  '--hr-symbol-size': '',
  '--hr-symbol-color': '',
  '--hr-gap': '',
  '--hr-line-color': '',
  '--hr-line-thickness': '',
};

export const HR_PRESETS: HrPreset[] = [
  {
    label: '简约细线',
    description: '最基础的单色细线，适合大多数场景。',
    styles: {
      ...HR_CLEAR_SYMBOL,
      'height': '1px',
      'width': '',
      'background-color': '#d5d5d5',
      'background': '',
      'border': 'none',
      'border-top': '',
      'border-bottom': '',
      'border-left': '',
      'border-right': '',
      'border-radius': '',
      'margin': '36px auto',
      'opacity': '',
      'box-shadow': '',
    },
  },
  {
    label: '渐变彩虹',
    description: '多彩渐变线条，活泼风格。',
    styles: {
      ...HR_CLEAR_SYMBOL,
      'height': '3px',
      'width': '',
      'background-color': '',
      'background': 'linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff)',
      'border': 'none',
      'border-top': '',
      'border-bottom': '',
      'border-left': '',
      'border-right': '',
      'border-radius': '2px',
      'margin': '36px auto',
      'opacity': '',
      'box-shadow': '',
    },
  },
  {
    label: '居中短线',
    description: '居中短粗线条，简约有重点。',
    styles: {
      ...HR_CLEAR_SYMBOL,
      'height': '3px',
      'width': '',
      'background-color': '#1d1d1f',
      'background': '',
      'border': 'none',
      'border-top': '',
      'border-bottom': '',
      'border-left': '',
      'border-right': '',
      'border-radius': '2px',
      'margin': '36px 30%',
      'opacity': '',
      'box-shadow': '',
    },
  },
  {
    label: '点线分隔',
    description: '圆点线，轻量不抢眼。可在"线条边框"中改为 dashed 虚线。',
    styles: {
      ...HR_CLEAR_SYMBOL,
      'height': '0',
      'width': '',
      'background-color': '',
      'background': 'transparent',
      'border': '',
      'border-top': '2px dotted #aaa',
      'border-bottom': 'none',
      'border-left': 'none',
      'border-right': 'none',
      'border-radius': '',
      'margin': '36px auto',
      'opacity': '',
      'box-shadow': '',
    },
  },
  {
    label: '渐隐淡出',
    description: '从中间向两端渐隐，柔和优雅。',
    styles: {
      ...HR_CLEAR_SYMBOL,
      'height': '1px',
      'width': '',
      'background-color': '',
      'background': 'linear-gradient(90deg, transparent, #999, transparent)',
      'border': 'none',
      'border-top': '',
      'border-bottom': '',
      'border-left': '',
      'border-right': '',
      'border-radius': '',
      'margin': '36px auto',
      'opacity': '',
      'box-shadow': '',
    },
  },
  {
    label: '粗条强调',
    description: '加粗色条，用于内容区块的强分隔。',
    styles: {
      ...HR_CLEAR_SYMBOL,
      'height': '6px',
      'width': '',
      'background-color': '#0066cc',
      'background': '',
      'border': 'none',
      'border-top': '',
      'border-bottom': '',
      'border-left': '',
      'border-right': '',
      'border-radius': '3px',
      'margin': '36px auto',
      'opacity': '',
      'box-shadow': '',
    },
  },
  {
    label: '阴影浮动',
    description: '带阴影的细线，微妙的立体效果。',
    styles: {
      ...HR_CLEAR_SYMBOL,
      'height': '1px',
      'width': '',
      'background-color': '#e0e0e0',
      'background': '',
      'border': 'none',
      'border-top': '',
      'border-bottom': '',
      'border-left': '',
      'border-right': '',
      'border-radius': '',
      'margin': '36px auto',
      'opacity': '',
      'box-shadow': '0 2px 8px rgba(0,0,0,0.1)',
    },
  },
  {
    label: '居中装饰',
    description: '线条中央嵌入装饰符号，可在下方切换 ●/◆/◇ 等。',
    styles: {
      'height': '',
      'width': '',
      'background-color': '',
      'background': '',
      'border': 'none',
      'border-top': '',
      'border-bottom': '',
      'border-left': '',
      'border-right': '',
      'border-radius': '',
      'margin': '36px auto',
      'opacity': '',
      'box-shadow': '',
      '--hr-symbol': '◆',
      '--hr-symbol-position': 'center',
      '--hr-symbol-size': '10px',
      '--hr-symbol-color': '#999',
      '--hr-gap': '16px',
      '--hr-line-color': '#ddd',
      '--hr-line-thickness': '1px',
    },
  },
  {
    label: '两侧装饰',
    description: '两端嵌入装饰符号，线条在中间连接。',
    styles: {
      'height': '',
      'width': '',
      'background-color': '',
      'background': '',
      'border': 'none',
      'border-top': '',
      'border-bottom': '',
      'border-left': '',
      'border-right': '',
      'border-radius': '',
      'margin': '36px auto',
      'opacity': '',
      'box-shadow': '',
      '--hr-symbol': '◆',
      '--hr-symbol-position': 'sides',
      '--hr-symbol-size': '10px',
      '--hr-symbol-color': '#999',
      '--hr-gap': '16px',
      '--hr-line-color': '#ddd',
      '--hr-line-thickness': '1px',
    },
  },
  {
    label: '三点装饰',
    description: '居中三个小圆点替代线条，极简留白。',
    styles: {
      'height': '',
      'width': '',
      'background-color': '',
      'background': '',
      'border': 'none',
      'border-top': '',
      'border-bottom': '',
      'border-left': '',
      'border-right': '',
      'border-radius': '',
      'margin': '36px auto',
      'opacity': '',
      'box-shadow': '',
      '--hr-symbol': '● ● ●',
      '--hr-symbol-position': 'center',
      '--hr-symbol-size': '8px',
      '--hr-symbol-color': '#aaa',
      '--hr-gap': '0',
      '--hr-line-color': '',
      '--hr-line-thickness': '',
    },
  },
  {
    label: '双线分隔',
    description: '上下两条细线，经典书籍排版风格。',
    styles: {
      ...HR_CLEAR_SYMBOL,
      'height': '4px',
      'width': '',
      'background-color': '',
      'background': 'transparent',
      'border-top': '1px solid #c0c0c0',
      'border-bottom': '1px solid #c0c0c0',
      'border-left': 'none',
      'border-right': 'none',
      'border': '',
      'border-radius': '',
      'margin': '36px auto',
      'opacity': '',
      'box-shadow': '',
    },
  },
];

export interface BlockquotePreset {
  label: string;
  description: string;
  styles: StyleDeclaration;
}

const BQ_CLEAR_DECORATION: StyleDeclaration = {
  '--bq-decoration': '',
  '--bq-corner-color': '',
};

export const BLOCKQUOTE_PRESETS: BlockquotePreset[] = [
  {
    label: '经典左线',
    description: '左侧色条 + 浅灰背景，最常见的引用样式。',
    styles: {
      ...BQ_CLEAR_DECORATION,
      'border-left': '4px solid #0066cc',
      'border-top': '',
      'border-right': '',
      'border-bottom': '',
      'border': '',
      'background-color': '#f8f9fa',
      'color': '#555',
      'padding': '16px 20px',
      'border-radius': '0 8px 8px 0',
      'box-shadow': '',
      'font-style': '',
    },
  },
  {
    label: '柔和卡片',
    description: '圆角 + 微阴影，现代卡片式。',
    styles: {
      ...BQ_CLEAR_DECORATION,
      'border-left': '',
      'border-top': '1px solid rgba(0,0,0,0.06)',
      'border-right': '1px solid rgba(0,0,0,0.06)',
      'border-bottom': '1px solid rgba(0,0,0,0.06)',
      'border': '',
      'background-color': '#f0f4f8',
      'color': '#444',
      'padding': '20px 24px',
      'border-radius': '12px',
      'box-shadow': '0 2px 12px rgba(0,0,0,0.04)',
      'font-style': '',
    },
  },
  {
    label: '强调色块',
    description: '纯色背景 + 白字，强烈突出引用。',
    styles: {
      ...BQ_CLEAR_DECORATION,
      'border-left': '',
      'border-top': '',
      'border-right': '',
      'border-bottom': '',
      'border': 'none',
      'background-color': '#0066cc',
      'color': '#ffffff',
      'padding': '20px 24px',
      'border-radius': '12px',
      'box-shadow': '',
      'font-style': '',
    },
  },
  {
    label: '斜体引用',
    description: '斜体 + 左线，文学感引用风格。',
    styles: {
      ...BQ_CLEAR_DECORATION,
      'border-left': '3px solid #ddd',
      'border-top': '',
      'border-right': '',
      'border-bottom': '',
      'border': '',
      'background-color': '#fafafa',
      'color': '#555',
      'padding': '20px 24px',
      'border-radius': '0 8px 8px 0',
      'box-shadow': '',
      'font-style': 'italic',
    },
  },
  {
    label: '虚线边框',
    description: '四周虚线框 + 透明背景，轻量文档风格。',
    styles: {
      ...BQ_CLEAR_DECORATION,
      'border-left': '',
      'border-top': '',
      'border-right': '',
      'border-bottom': '',
      'border': '2px dashed #d0d0d0',
      'background-color': '',
      'color': '#555',
      'padding': '16px 20px',
      'border-radius': '8px',
      'box-shadow': '',
      'font-style': '',
    },
  },
  {
    label: '直角装饰',
    description: '左上/右下双层直角装饰框，精致排版感。',
    styles: {
      'border-left': '',
      'border-top': '',
      'border-right': '',
      'border-bottom': '',
      'border': 'none',
      'background-color': '',
      'color': '',
      'padding': '10px',
      'border-radius': '',
      'box-shadow': '',
      'font-style': '',
      '--bq-decoration': 'corner-frame',
      '--bq-corner-color': '#9e9e9e',
    },
  },
];

export interface PrePreset {
  label: string;
  description: string;
  styles: StyleDeclaration;
}

export const PRE_PRESETS: PrePreset[] = [
  {
    label: 'Mac 风格',
    description: '搭配三色圆点的经典 Mac 终端风格。',
    styles: {
      'background-color': '#f6f8fa',
      'color': '',
      'padding': '20px',
      'border-top': '',
      'border-right': '',
      'border-bottom': '',
      'border-left': '',
      'border': '1px solid rgba(0,0,0,0.08)',
      'border-radius': '12px',
      'box-shadow': '',
    },
  },
  {
    label: '暗色终端',
    description: '深色背景 + 浅色文字，开发者风格。',
    styles: {
      'background-color': '#1e1e2e',
      'color': '#cdd6f4',
      'padding': '20px',
      'border-top': '',
      'border-right': '',
      'border-bottom': '',
      'border-left': '',
      'border': '1px solid rgba(255,255,255,0.06)',
      'border-radius': '12px',
      'box-shadow': '',
    },
  },
  {
    label: '左侧色条',
    description: '左侧强调色条，与引用块风格统一。',
    styles: {
      'background-color': '#f6f8fa',
      'color': '',
      'padding': '20px',
      'border-top': '1px solid #e8e8e8',
      'border-right': '1px solid #e8e8e8',
      'border-bottom': '1px solid #e8e8e8',
      'border-left': '4px solid #0066cc',
      'border': '',
      'border-radius': '0 8px 8px 0',
      'box-shadow': '',
    },
  },
  {
    label: '阴影浮动',
    description: '白底 + 阴影，干净的浮动卡片效果。',
    styles: {
      'background-color': '#ffffff',
      'color': '',
      'padding': '20px',
      'border-top': '',
      'border-right': '',
      'border-bottom': '',
      'border-left': '',
      'border': 'none',
      'border-radius': '12px',
      'box-shadow': '0 4px 20px rgba(0,0,0,0.08)',
    },
  },
];

export interface ImgPreset {
  label: string;
  description: string;
  styles: StyleDeclaration;
}

export const IMG_PRESETS: ImgPreset[] = [
  {
    label: '双图并列',
    description: '连续图片两两并排显示（默认模式）。',
    styles: { '--img-grid-mode': 'grid' },
  },
  {
    label: '滑动轮播',
    description: '连续图片变为可横向滑动的轮播。',
    styles: { '--img-grid-mode': 'carousel' },
  },
];