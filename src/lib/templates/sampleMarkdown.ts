import { defaultShowcaseContent } from '../../content/defaultShowcase';

export const selectorPreviewMarkdown: Record<string, string> = {
  container: '# 页面容器预览\n\n这里主要用于观察背景、宽度、内边距和整体阅读节奏。现在大部分全局页面设定都可以在 `container` 中完成。',
  h1: '# 一级标题示例',
  h2: '## 二级标题示例',
  h3: '### 三级标题示例',
  h4: '#### 四级标题示例',
  p: '这是一段正文示例，用来观察字体、字号、行高、段落间距与颜色的变化。',
  strong: '这里是一段包含 **重点强调文字** 的示例。',
  em: '这里是一段包含 *斜体文字* 的示例。',
  u: '这里是一段包含 ++下划线文字++ 的示例。',
  a: '这是一个 [链接样式示例](https://mp.weixin.qq.com/)。',
  ul: '- 列表项一\n- 列表项二\n- 列表项三',
  ol: '1. 有序项一\n2. 有序项二\n3. 有序项三',
  li: '- 单个列表项示例',
  blockquote: '> 这是一个引用块，用来观察背景、左边线、圆角、内边距与文字颜色。',
  code: "行内代码示例：`const template = 'wechat';`",
  pre: '```javascript\nconst article = {\n  title: "SNS Publish Template Studio",\n  save: async () => true,\n};\n```',
  hr: '上方内容\n\n---\n\n下方内容',
  img: '![图片 1](/showcase/default-cover.svg)\n\n![图片 2](/showcase/default-grid-a.svg)\n\n![图片 3](/showcase/default-grid-b.svg)\n\n![图片 4](/showcase/default-cover.svg)\n\n![图片 5](/showcase/default-grid-a.svg)',
  table: '| Feature | Status |\n| --- | --- |\n| Template Save | Ready |\n| Local Writeback | Ready |',
  th: '| Header A | Header B |\n| --- | --- |\n| Cell A | Cell B |',
  td: '| Column A | Column B |\n| --- | --- |\n| Value A | Value B |',
  tr: '| Name | Value |\n| --- | --- |\n| Theme | Editable |',
};

export const fullPreviewMarkdown = defaultShowcaseContent;
