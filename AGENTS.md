# AGENTS.md

This file is the persistent engineering guide for AI agents working in this repository. Treat it as the technical baseline for future refactors and feature work.

## 1. Project Summary

`sns-publish` is a browser-only React + TypeScript application for general social publishing workflows, with the current implementation primarily optimized for WeChat official account articles.

Primary user value:

1. Paste rich text from sources such as Feishu, Notion, Word, or webpages.
2. Convert pasted content into Markdown with minimal manual cleanup.
3. Render themed HTML previews in real time.
4. Export the result as HTML or PDF.
5. Copy a WeChat-compatible HTML payload into the clipboard for pasting into the WeChat editor.

There is no backend. All parsing, rendering, compatibility fixing, exporting, and clipboard work happens in the browser.

## 2. Stack

- React 18
- TypeScript
- Vite 5
- Tailwind CSS 3
- markdown-it for Markdown rendering
- highlight.js for code block highlighting
- turndown + turndown-plugin-gfm for HTML to Markdown conversion
- html2pdf.js for PDF export
- framer-motion for UI motion
- Vitest + jsdom for unit tests

## 3. High-Value Files

- `src/App.tsx`
  - Main orchestration layer.
  - Owns application state and output actions.
- `src/components/EditorPanel.tsx`
  - Markdown input area and paste entry point.
- `src/components/PreviewPanel.tsx`
  - Injects final themed HTML into preview DOM.
- `src/components/Toolbar.tsx`
  - Export / copy / preview mode actions.
- `src/lib/htmlToMarkdown.ts`
  - Smart paste pipeline.
- `src/lib/markdown.ts`
  - Markdown preprocessing, rendering, theme application.
- `src/lib/wechatCompat.ts`
  - WeChat-specific DOM compatibility pass.
- `src/lib/*.test.ts`
  - Unit coverage for tricky formatting behavior.

## 4. Core Runtime Pipeline

Understand this pipeline before changing anything:

1. User pastes content into the editor textarea.
2. `handleSmartPaste()` in `src/lib/htmlToMarkdown.ts` decides whether the clipboard content is:
   - image file(s)
   - plain Markdown
   - IDE/code-like HTML
   - rich HTML
3. Rich HTML is converted to Markdown using `turndown`.
4. Image paste is converted into Markdown image syntax with `data:` URLs.
5. `markdownInput` state changes in `src/App.tsx`.
6. `preprocessMarkdown()` repairs known Markdown edge cases.
7. `md.render()` converts Markdown to raw HTML.
8. `applyTheme()` rewrites the DOM and injects inline theme styles.
9. `renderedHtml` is shown in the preview.
10. Output path depends on user action:
   - Export HTML: download `renderedHtml`
   - Export PDF: render preview DOM through `html2pdf.js`
   - Copy to WeChat: run `makeWeChatCompatible(renderedHtml, activeTheme)` first, then write clipboard HTML

## 5. Important Architectural Truths

These are non-trivial invariants. Preserve them unless a deliberate redesign is happening.

### 5.1 `renderedHtml` is already themed output

`renderedHtml` is not raw Markdown output. It is the post-theme HTML fragment returned by `applyTheme()`.

Consequences:

- HTML export should stay self-contained.
- Preview should closely match export output.
- Theme changes happen before export, not during export.

### 5.2 HTML export, PDF export, and WeChat copy are three different output targets

Do not merge these paths casually.

- HTML export optimizes for portable self-contained HTML.
- PDF export optimizes for visual fidelity from the preview DOM.
- WeChat copy optimizes for compatibility with the WeChat editor, not DOM purity.

### 5.3 Themes are inline-style based by design

Theme objects are selector-to-style maps. This is intentional because:

- exported HTML should not depend on external CSS
- pasted WeChat HTML should retain style without stylesheet support

Avoid redesigning themes around runtime CSS classes unless the output strategy also changes.

### 5.4 `applyTheme()` is a DOM transformation layer, not just a style pass

It currently:

- injects inline styles
- groups consecutive image paragraphs into image grids
- normalizes list markers
- inlines code highlight token styles
- adjusts heading inline children
- wraps content in a styled container

Any refactor here can affect preview, export HTML, and WeChat copy at the same time.

### 5.5 `makeWeChatCompatible()` is a platform adaptation layer

It is not redundant with `applyTheme()`.

It currently:

- rewrites the root container as `section`
- converts flex-like image layouts into table layouts
- flattens some list-item structure
- distributes text styles to child nodes
- fixes punctuation adjacency around inline emphasis
- converts image URLs to Base64 `data:` URLs

This path is the most fragile integration point for WeChat behavior. Be conservative.

### 5.6 WeChat Empty Element Collapse and the SVG Placeholder Trick

WeChat's editor aggressively collapses elements that have no visible content. This affects:

- Elements with only `border-top`/`border-bottom` (no text, no child content)
- Elements with only `background-color` and `height` (empty)
- Elements with `&nbsp;` + `overflow: hidden` (WeChat ignores overflow)
- `display: inline-block` spans with zero height

The proven workaround (used by professional WeChat publishing tools): insert a **zero-width SVG** inside the element:

```html
<section style="border-top: 1px solid #ddd;">
  <svg viewBox="0 0 1 1" style="float:left;line-height:0;width:0;vertical-align:top;"></svg>
</section>
```

This gives WeChat "content" to prevent collapse, while the SVG is invisible (zero width, float left). This technique is used in `makeWeChatCompatible()` for hr decoration lines and should be reused for any future custom components that need empty-looking styled elements in WeChat.

Note: WeChat **does** support `display: flex` — do not blindly strip flex from all elements. The existing compat code only converts flex for image grids (to table layout); other flex containers can pass through.

## 6. Change Guardrails

### 6.1 If you change paste behavior

Preserve all of the following unless explicitly replacing them:

- image paste becomes Markdown image syntax
- Markdown pasted from IDE-like sources should not be unnecessarily re-converted
- rich HTML paste should degrade gracefully to plain text on failure
- local `file:///` references should not leak into useful output
- insertion should respect the current selection and caret

Files to inspect first:

- `src/components/EditorPanel.tsx`
- `src/lib/htmlToMarkdown.ts`
- `src/lib/htmlToMarkdown.test.ts`

### 6.2 If you change Markdown rendering

Preserve:

- punctuation-adjacent bold fixes
- code block highlighting
- self-contained HTML output
- list marker restoration

Files to inspect first:

- `src/lib/markdown.ts`
- `src/lib/markdown.test.ts`

### 6.3 If you change theme behavior

Preserve:

- the `Theme` object shape
- inline-style output model
- container-level wrapper styling
- image grid handling
- code token inline styling

Avoid hardcoding the total number of templates in logic. Read from the loaded template library instead.

### 6.4 If you change WeChat compatibility

Validate at minimum:

- single image and multi-image copy behavior
- external image to Base64 conversion
- list rendering after paste
- heading and paragraph typography
- punctuation near `strong` / `em` / `a` / `code`

Files to inspect first:

- `src/lib/wechatCompat.ts`
- `src/App.tsx`
- `src/lib/markdown.ts`

### 6.5 If you change export behavior

Know what each export consumes:

- HTML export consumes the `renderedHtml` string
- PDF export consumes the live preview DOM
- WeChat copy consumes `renderedHtml` after compatibility rewriting

Do not assume a fix in one path automatically fixes the others.

## 7. Testing Expectations

Before finishing substantial changes, prefer these checks:

```bash
pnpm test
pnpm build
```

At minimum:

- run unit tests when changing paste, rendering, theme, or compatibility logic
- run build when changing TypeScript types or app wiring

## 8. Known Sensitive Areas

- Chinese punctuation next to Markdown emphasis markers
- image grid layout conversion
- Base64 image generation and clipboard behavior
- preview DOM versus export DOM differences
- scroll sync across PC / mobile / tablet preview modes
- any change to `dangerouslySetInnerHTML` inputs or container structure

## 9. Preferred Development Approach

When making changes:

1. Start from the user-facing flow first.
2. Trace which stage owns the behavior:
   - paste normalization
   - Markdown preprocessing
   - HTML rendering
   - theme DOM transformation
   - WeChat compatibility
   - export action
3. Make the smallest coherent change at the layer that actually owns the behavior.
4. Add or update tests near that layer.

## 10. Anti-Patterns To Avoid

- Do not add server-side processing unless there is a very strong product reason.
- Do not move theme styling responsibility entirely into external CSS without redesigning export/copy guarantees.
- Do not collapse HTML export and WeChat copy into the same output path.
- Do not remove edge-case Markdown preprocessing just because it looks unusual; tests exist for real regressions.
- Do not replace DOM-based compatibility fixes with regex-only HTML rewrites.

## 11. Quick Start For New Agents

If you are new to the codebase, read files in this order:

1. `src/App.tsx`
2. `src/components/EditorPanel.tsx`
3. `src/lib/htmlToMarkdown.ts`
4. `src/lib/markdown.ts`
5. `src/lib/wechatCompat.ts`
6. `src/components/PreviewPanel.tsx`
7. `src/lib/templates/library.ts`
8. tests in `src/lib/*.test.ts`

## 12. File Naming Note

Use `AGENTS.md`, not `AGENT.md`.

Reason:

- `AGENTS.md` is the more common repo-level convention for persistent agent instructions.
- It also scales better if multiple tools or agent entry points consume the same file.
