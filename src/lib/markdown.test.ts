import { describe, expect, it } from 'vitest';
import { applyTheme, md, preprocessMarkdown } from './markdown';

function renderMarkdown(markdown: string) {
    return md.render(preprocessMarkdown(markdown));
}

describe('preprocessMarkdown', () => {
    it('keeps bold rendering intact next to trailing punctuation', () => {
        const html = renderMarkdown('2025年初，伦敦黄金市场的一个月拆借利率一度升至**5%**。');

        expect(html).toContain('<strong>5%</strong>。');
        expect(html).not.toContain('**5%**');
    });

    it('repairs bold segments that start with a symbol and attach to previous text', () => {
        const html = renderMarkdown('利率变化至**-5%**。');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const strong = doc.querySelector('strong');

        expect(strong?.textContent?.replace(/\u200B/g, '')).toBe('-5%');
    });

    it('does not merge separate bold blocks across blank lines', () => {
        const html = renderMarkdown('**5 %**\n\n**5%**');
        const doc = new DOMParser().parseFromString(html, 'text/html');

        expect(doc.querySelectorAll('strong')).toHaveLength(2);
    });

    it('renders custom underline syntax with double plus markers', () => {
        const html = renderMarkdown('这里是 ++下划线++ 示例');
        const doc = new DOMParser().parseFromString(html, 'text/html');

        expect(doc.querySelector('u')?.textContent).toBe('下划线');
    });

    it('preserves base64 data URLs in images without corruption', () => {
        // Base64 contains `+` characters that must not be treated as `++` underline markers
        const base64Src = 'data:image/png;base64,iVBOR++w0KGgo++AAAAN++SU/hEUg==';
        const input = `![图片](${base64Src})`;
        const html = renderMarkdown(input);
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const img = doc.querySelector('img');

        expect(img).not.toBeNull();
        expect(img?.getAttribute('src')).toBe(base64Src);
        expect(html).not.toContain('<u>');
    });

    it('preserves external URLs in images', () => {
        const input = '![photo](https://example.com/img++test++.png)';
        const html = renderMarkdown(input);
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const img = doc.querySelector('img');

        expect(img?.getAttribute('src')).toBe('https://example.com/img++test++.png');
    });

    it('still converts ++underline++ outside of image URLs', () => {
        const input = '++强调++ 和 ![图片](data:image/png;base64,abc++def++)';
        const html = renderMarkdown(input);
        const doc = new DOMParser().parseFromString(html, 'text/html');

        expect(doc.querySelector('u')?.textContent).toBe('强调');
        expect(doc.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,abc++def++');
    });
});

describe('applyTheme', () => {
    it('groups consecutive standalone images into an image grid', () => {
        const html = '<p><img src="a.png" /></p><p><img src="b.png" /></p>';
        const themed = applyTheme(html, 'apple');
        const doc = new DOMParser().parseFromString(themed, 'text/html');
        const grid = doc.querySelector('.image-grid');

        expect(grid).not.toBeNull();
        expect(grid?.querySelectorAll('img')).toHaveLength(2);
    });

    it('keeps highlighted comments non-italic', () => {
        const rawHtml = renderMarkdown('```javascript\n// 中文注释\nconst raphael = 1;\n```');
        const themed = applyTheme(rawHtml, 'geek');
        const doc = new DOMParser().parseFromString(themed, 'text/html');
        const code = doc.querySelector('pre code');
        const comment = doc.querySelector('.hljs-comment');

        expect(code?.getAttribute('style')).toContain('font-style: normal !important;');
        expect(code?.getAttribute('style')).toContain('white-space: pre;');
        expect(comment?.getAttribute('style')).toContain('font-style: normal;');
    });

    it('does not override terminal block-code font inheritance', () => {
        const rawHtml = renderMarkdown('```javascript\n// terminal theme\nconst raphael = 1;\n```');
        const themed = applyTheme(rawHtml, 'terminal');
        const doc = new DOMParser().parseFromString(themed, 'text/html');
        const container = doc.querySelector('body > div');
        const pre = doc.querySelector('pre');
        const code = doc.querySelector('pre code');

        expect(container?.getAttribute('style')).toContain('"Courier New"');
        expect(pre?.getAttribute('style')).not.toContain('font-family:');
        // code uses font-family: inherit to pick up pre/container font
        expect(code?.getAttribute('style')).toContain('font-family: inherit');
    });
});
