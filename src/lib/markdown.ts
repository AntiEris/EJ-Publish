import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { buildTemplateStyleMap, getBundledTemplates, styleDeclarationToString } from './templates';
import type { StyleDeclaration, TemplateDefinition } from './templates';

export const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false,
    highlight: function (str, lang) {
        let codeContent = '';
        if (lang && hljs.getLanguage(lang)) {
            try {
                codeContent = hljs.highlight(str, { language: lang }).value;
            } catch (__) {
                codeContent = md.utils.escapeHtml(str);
            }
        } else {
            codeContent = md.utils.escapeHtml(str);
        }

        const dots = '<div style="margin-bottom: 12px; white-space: nowrap;"><span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #ff5f56; margin-right: 6px;"></span><span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #ffbd2e; margin-right: 6px;"></span><span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #27c93f;"></span></div>';

        return `<pre>${dots}<code class="hljs">${codeContent}</code></pre>`;
    }
});

// Avoid bold fragmentation when pasting from certain apps
export function preprocessMarkdown(content: string) {
    // Protect image/link URLs from being mangled by later replacements.
    // Base64 data URLs frequently contain `+` characters which would be
    // corrupted by the `++…++` underline conversion below.
    const urlPlaceholders: string[] = [];
    content = content.replace(/(!?\[[^\]]*\])\(([^)]*)\)/g, (_match, prefix, url) => {
        const index = urlPlaceholders.length;
        urlPlaceholders.push(url);
        return `${prefix}(\x00URL${index}\x00)`;
    });

    content = content.replace(/^[ ]{0,3}(\*[ ]*\*[ ]*\*[\* ]*)[ \t]*$/gm, '***');
    content = content.replace(/^[ ]{0,3}(-[ ]*-[ ]*-[- ]*)[ \t]*$/gm, '---');
    content = content.replace(/^[ ]{0,3}(_[ ]*_[ ]*_[_ ]*)[ \t]*$/gm, '___');
    content = content.replace(/\*\*[ \t]+\*\*/g, ' ');
    content = content.replace(/\*{4,}/g, '');
    content = content.replace(/\+\+([^\n+][\s\S]*?[^\n+])\+\+/g, '<u>$1</u>');
    // markdown-it may fail to open bold when content starts with punctuation/symbol
    // and `**` is attached directly to preceding text (e.g. `至**-5%**。`).
    // Insert a zero-width separator only inside opening `**...` for these cases.
    content = content.replace(
        /([^\s])\*\*([+\-＋－%％~～!！?？,，.。:：;；、\\/|@#￥$^&*_=（）()【】\[\]《》〈〉「」『』”””'`…·][^\n*]*?)\*\*/g,
        '$1**\u200B$2**'
    );

    // Restore protected URLs
    content = content.replace(/\x00URL(\d+)\x00/g, (_match, index) => urlPlaceholders[Number(index)]);

    return content;
}

function resolveTemplate(templateOrId: TemplateDefinition | string): TemplateDefinition {
    if (typeof templateOrId !== 'string') return templateOrId;
    const templates = getBundledTemplates();
    return templates.find((template) => template.id === templateOrId) || templates[0];
}

function applyInlineStyle(el: Element, style: StyleDeclaration | undefined) {
    if (!style) return;
    const nextStyle = styleDeclarationToString(style);
    if (!nextStyle) return;
    const currentStyle = el.getAttribute('style') || '';
    el.setAttribute('style', currentStyle ? `${currentStyle}; ${nextStyle}` : nextStyle);
}

export function applyTheme(html: string, templateOrId: TemplateDefinition | string) {
    const template = resolveTemplate(templateOrId);
    const styleMap = buildTemplateStyleMap(template);

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Specific inline overrides to prevent headings from uninheriting styles
    const headingInlineOverrides: Record<string, string> = {
        strong: 'font-weight: 700; color: inherit !important; background-color: transparent !important;',
        em: 'font-style: italic; color: inherit !important; background-color: transparent !important;',
        a: 'color: inherit !important; text-decoration: none !important; border-bottom: 1px solid currentColor !important; background-color: transparent !important;',
        code: 'color: inherit !important; background-color: transparent !important; border: none !important; padding: 0 !important;',
    };


    const getSingleImageNode = (p: HTMLParagraphElement): HTMLElement | null => {
        const children = Array.from(p.childNodes).filter(n =>
            !(n.nodeType === Node.TEXT_NODE && !(n.textContent || '').trim()) &&
            !(n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName === 'BR')
        );
        if (children.length !== 1) return null;
        const onlyChild = children[0];
        if (onlyChild.nodeName === 'IMG') return onlyChild as HTMLElement;
        if (onlyChild.nodeName === 'A' && onlyChild.childNodes.length === 1 && onlyChild.childNodes[0].nodeName === 'IMG') {
            return onlyChild as HTMLElement;
        }
        return null;
    };

    // Merge consecutive single-image paragraphs into grids or carousel.
    const imgGridMode = styleMap.img?.['--img-grid-mode'] || 'grid';
    const paragraphSnapshot = Array.from(doc.querySelectorAll('p'));
    for (const paragraph of paragraphSnapshot) {
        if (!paragraph.isConnected) continue;
        const parent = paragraph.parentElement;
        if (!parent) continue;
        if (!getSingleImageNode(paragraph)) continue;

        const run: HTMLParagraphElement[] = [paragraph];
        let cursor = paragraph.nextElementSibling;
        while (cursor && cursor.tagName === 'P') {
            const p = cursor as HTMLParagraphElement;
            if (!getSingleImageNode(p)) break;
            run.push(p);
            cursor = p.nextElementSibling;
        }

        if (run.length < 2) continue;

        if (imgGridMode === 'carousel') {
            // Carousel mode: all consecutive images in a scroll-snap container
            const carousel = doc.createElement('section');
            carousel.classList.add('image-carousel');
            carousel.setAttribute('style', `display: flex; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; gap: ${styleMap.img?.padding?.split(/\s+/)?.[1] || styleMap.img?.padding || '4px'}; margin: ${styleMap.img?.margin || '24px 0'}; scrollbar-width: none;`);

            // Insert carousel at the position of the first paragraph BEFORE removing anything
            run[0].before(carousel);

            for (const p of run) {
                if (!p.isConnected) continue;
                const imgNode = getSingleImageNode(p);
                if (!imgNode) continue;
                const slide = doc.createElement('div');
                slide.setAttribute('style', 'flex: 0 0 100%; scroll-snap-align: center; box-sizing: border-box;');
                slide.appendChild(imgNode);
                carousel.appendChild(slide);
                p.remove();
            }

            // Indicator dots
            const dots = doc.createElement('div');
            dots.setAttribute('style', 'display: flex; justify-content: center; gap: 6px; margin-top: 8px;');
            const slideCount = carousel.children.length;
            for (let i = 0; i < slideCount; i++) {
                const dot = doc.createElement('span');
                dot.setAttribute('style', 'display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #bbb;');
                dots.appendChild(dot);
            }
            carousel.after(dots);
        } else {
            // Grid mode (default): pair images two by two
            for (let i = 0; i + 1 < run.length; i += 2) {
                const first = run[i];
                const second = run[i + 1];
                if (!first.isConnected || !second.isConnected) continue;

                const firstImageNode = getSingleImageNode(first);
                const secondImageNode = getSingleImageNode(second);
                if (!firstImageNode || !secondImageNode) continue;

                const gridParagraph = doc.createElement('p');
                gridParagraph.classList.add('image-grid');
                gridParagraph.setAttribute('style', `display: flex; justify-content: center; gap: 8px; margin: ${styleMap.img?.margin || '24px 0'}; margin-left: auto; margin-right: auto; align-items: flex-start;`);
                gridParagraph.appendChild(firstImageNode);
                gridParagraph.appendChild(secondImageNode);

                first.before(gridParagraph);
                first.remove();
                second.remove();
            }
        }
    }

    // Process multi-image paragraphs (images in same <p> without blank line between them)
    const paragraphs = doc.querySelectorAll('p');
    paragraphs.forEach(p => {
        const children = Array.from(p.childNodes).filter(n => !(n.nodeType === Node.TEXT_NODE && !(n.textContent || '').trim()));
        const isAllImages = children.length > 1 && children.every(n => n.nodeName === 'IMG' || (n.nodeName === 'A' && n.childNodes.length === 1 && n.childNodes[0].nodeName === 'IMG'));

        if (isAllImages) {
            if (imgGridMode === 'carousel') {
                // Carousel mode for multi-image paragraphs
                const carousel = doc.createElement('section');
                carousel.classList.add('image-carousel');
                carousel.setAttribute('style', `display: flex; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; gap: ${styleMap.img?.padding?.split(/\s+/)?.[1] || styleMap.img?.padding || '4px'}; margin: ${styleMap.img?.margin || '24px 0'}; scrollbar-width: none;`);

                const imgNodes = Array.from(children) as HTMLElement[];
                for (const imgNode of imgNodes) {
                    const slide = doc.createElement('div');
                    slide.setAttribute('style', 'flex: 0 0 100%; scroll-snap-align: center; box-sizing: border-box;');
                    slide.appendChild(imgNode);
                    carousel.appendChild(slide);
                }

                const dots = doc.createElement('div');
                dots.setAttribute('style', 'display: flex; justify-content: center; gap: 6px; margin-top: 8px;');
                for (let i = 0; i < imgNodes.length; i++) {
                    const dot = doc.createElement('span');
                    dot.setAttribute('style', 'display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #bbb;');
                    dots.appendChild(dot);
                }

                p.before(carousel);
                carousel.after(dots);
                p.remove();
            } else {
                // Grid mode (default)
                p.classList.add('image-grid');
                p.setAttribute('style', `display: flex; justify-content: center; gap: 8px; margin: ${styleMap.img?.margin || '24px 0'}; margin-left: auto; margin-right: auto; align-items: flex-start;`);

                p.querySelectorAll('img').forEach(img => {
                    img.classList.add('grid-img');
                    const w = 100 / children.length;
                    img.setAttribute('style', `width: calc(${w}% - ${8 * (children.length - 1) / children.length}px); margin: 0; border-radius: 8px; height: auto;`);
                });
            }
        }
    });

    Object.keys(styleMap).forEach((selector) => {

        if (selector === 'pre code') return;
        const elements = doc.querySelectorAll(selector);
        elements.forEach(el => {
            if (selector === 'code' && el.parentElement?.tagName === 'PRE') return;
            if (el.tagName === 'IMG' && el.closest('.image-grid')) return;
            if (el.classList.contains('image-grid') || el.classList.contains('image-carousel')) return;
            applyInlineStyle(el, styleMap[selector]);
        });
    });

    // Transform decorated hr elements (when --hr-symbol is set)
    const hrSymbol = styleMap.hr?.['--hr-symbol'];
    if (hrSymbol) {
        const hrGap = styleMap.hr?.['--hr-gap'] || '16px';
        const hrLineColor = styleMap.hr?.['--hr-line-color'] || '#ddd';
        const hrLineThickness = styleMap.hr?.['--hr-line-thickness'] || '1px';
        const hrSymbolColor = styleMap.hr?.['--hr-symbol-color'] || '#999';
        const hrSymbolSize = styleMap.hr?.['--hr-symbol-size'] || '10px';
        const hrMargin = styleMap.hr?.margin || '36px auto';
        const hrPosition = styleMap.hr?.['--hr-symbol-position'] || 'center';
        const showLines = Boolean(hrLineColor) && hrGap !== '0';

        const lineStyle = `flex: 1; height: 0; border-top: ${hrLineThickness} solid ${hrLineColor};`;
        const symbolPadding = showLines ? `0 ${hrGap}` : '0';
        const symbolStyle = `padding: ${symbolPadding}; white-space: nowrap; color: ${hrSymbolColor}; font-size: ${hrSymbolSize}; line-height: 1;`;

        doc.querySelectorAll('hr').forEach(hr => {
            const container = doc.createElement('section');
            container.className = 'hr-decoration';
            const flexExtra = showLines ? '' : ' justify-content: center;';
            container.setAttribute('style', `display: flex; align-items: center;${flexExtra} margin: ${hrMargin};`);

            if (hrPosition === 'sides') {
                const s1 = doc.createElement('span');
                s1.setAttribute('style', symbolStyle);
                s1.textContent = hrSymbol;
                container.appendChild(s1);
                if (showLines) {
                    const l = doc.createElement('span');
                    l.setAttribute('style', lineStyle);
                    container.appendChild(l);
                }
                const s2 = doc.createElement('span');
                s2.setAttribute('style', symbolStyle);
                s2.textContent = hrSymbol;
                container.appendChild(s2);
            } else {
                if (showLines) {
                    const l1 = doc.createElement('span');
                    l1.setAttribute('style', lineStyle);
                    container.appendChild(l1);
                }
                const s = doc.createElement('span');
                s.setAttribute('style', symbolStyle);
                s.textContent = hrSymbol;
                container.appendChild(s);
                if (showLines) {
                    const l2 = doc.createElement('span');
                    l2.setAttribute('style', lineStyle);
                    container.appendChild(l2);
                }
            }

            hr.replaceWith(container);
        });
    }

    // Transform decorated blockquote elements (corner-frame mode)
    const bqDecoration = styleMap.blockquote?.['--bq-decoration'];
    if (bqDecoration === 'corner-frame') {
        const cornerColor = styleMap.blockquote?.['--bq-corner-color'] || '#9e9e9e';
        const bqMargin = styleMap.blockquote?.margin || '24px 0';
        const svg = '<svg viewBox="0 0 1 1" style="float:left;line-height:0;width:0;vertical-align:top;"></svg>';
        const bs = `1px solid ${cornerColor}`;

        doc.querySelectorAll('blockquote').forEach(bq => {
            const wrapper = doc.createElement('section');
            wrapper.className = 'bq-corner-frame';
            wrapper.setAttribute('style', `margin: ${bqMargin}; position: relative; box-sizing: border-box;`);

            // Top-left: small corner + large L
            const topLeft = doc.createElement('section');
            topLeft.setAttribute('style', 'margin-bottom: -1.4em; box-sizing: border-box;');
            topLeft.innerHTML =
                `<section style="width: 0.62em; height: 0.62em; border-left: ${bs}; border-top: ${bs}; box-sizing: border-box;">${svg}</section>` +
                `<section style="width: 2.5em; height: 1.4em; margin-left: 0.31em; margin-top: -0.31em; border-left: ${bs}; border-top: ${bs}; box-sizing: border-box;">${svg}</section>`;
            wrapper.appendChild(topLeft);

            // Content
            const content = doc.createElement('section');
            content.setAttribute('style', 'padding: 0 0.31em; box-sizing: border-box;');
            // Remove blockquote's own margin (handled by wrapper) and border
            const bqStyle = bq.getAttribute('style') || '';
            bq.setAttribute('style', bqStyle.replace(/margin:\s*[^;]+;?/g, 'margin: 0;').replace(/border[^:]*:\s*[^;]+;?/g, ''));
            content.appendChild(bq.cloneNode(true));
            wrapper.appendChild(content);

            // Bottom-right: large L + small corner
            const bottomRight = doc.createElement('section');
            bottomRight.setAttribute('style', 'width: 2.5em; margin-top: -1.4em; margin-left: auto; box-sizing: border-box;');
            bottomRight.innerHTML =
                `<section style="width: 2.5em; height: 1.4em; margin-bottom: -0.31em; margin-left: -0.31em; border-right: ${bs}; border-bottom: ${bs}; box-sizing: border-box;">${svg}</section>`;
            wrapper.appendChild(bottomRight);

            const bottomCorner = doc.createElement('section');
            bottomCorner.setAttribute('style', `width: 0.62em; height: 0.62em; margin-left: auto; border-right: ${bs}; border-bottom: ${bs}; box-sizing: border-box;`);
            bottomCorner.innerHTML = svg;
            wrapper.appendChild(bottomCorner);

            bq.replaceWith(wrapper);
        });
    }

    // Tailwind preflight removes native list markers. Restore explicit markers.
    doc.querySelectorAll('ul').forEach(ul => {
        const currentStyle = ul.getAttribute('style') || '';
        ul.setAttribute('style', `${currentStyle}; list-style-type: disc !important; list-style-position: outside;`);
    });
    doc.querySelectorAll('ul ul').forEach(ul => {
        const currentStyle = ul.getAttribute('style') || '';
        ul.setAttribute('style', `${currentStyle}; list-style-type: circle !important;`);
    });
    doc.querySelectorAll('ul ul ul').forEach(ul => {
        const currentStyle = ul.getAttribute('style') || '';
        ul.setAttribute('style', `${currentStyle}; list-style-type: square !important;`);
    });
    doc.querySelectorAll('ol').forEach(ol => {
        const currentStyle = ol.getAttribute('style') || '';
        ol.setAttribute('style', `${currentStyle}; list-style-type: decimal !important; list-style-position: outside;`);
    });

    const hljsLight: Record<string, string> = {
        'hljs-comment': 'color: #6a737d; font-style: normal;',
        'hljs-quote': 'color: #6a737d; font-style: normal;',
        'hljs-keyword': 'color: #d73a49;',
        'hljs-selector-tag': 'color: #d73a49;',
        'hljs-string': 'color: #032f62;',
        'hljs-title': 'color: #6f42c1;',
        'hljs-section': 'color: #6f42c1;',
        'hljs-type': 'color: #005cc5;',
        'hljs-number': 'color: #005cc5;',
        'hljs-literal': 'color: #005cc5;',
        'hljs-built_in': 'color: #005cc5;',
        'hljs-variable': 'color: #e36209;',
        'hljs-template-variable': 'color: #e36209;',
        'hljs-tag': 'color: #22863a;',
        'hljs-name': 'color: #22863a;',
        'hljs-attr': 'color: #6f42c1;',
    };

    // Always inline hljs token colors — class-based styles won't survive
    // clipboard copy to WeChat or HTML export.
    const codeTokens = doc.querySelectorAll('.hljs span');
    codeTokens.forEach(span => {
        let inlineStyle = span.getAttribute('style') || '';
        if (inlineStyle && !inlineStyle.endsWith(';')) inlineStyle += '; ';
        span.classList.forEach(cls => {
            if (hljsLight[cls]) {
                inlineStyle += hljsLight[cls] + '; ';
            }
        });
        if (inlineStyle) {
            span.setAttribute('style', inlineStyle);
        }
    });

    doc.querySelectorAll('pre').forEach(pre => {
        const currentStyle = pre.getAttribute('style') || '';
        pre.setAttribute(
            'style',
            `${currentStyle}; font-variant-ligatures: none; tab-size: 2;`
        );
    });

    doc.querySelectorAll('pre code, pre .hljs, .hljs').forEach(codeNode => {
        const currentStyle = codeNode.getAttribute('style') || '';
        codeNode.setAttribute(
            'style',
            `${currentStyle}; display: block; font-family: inherit; font-size: inherit !important; line-height: inherit !important; font-style: normal !important; white-space: pre; word-break: normal; overflow-wrap: normal; background: transparent !important; color: inherit !important;`
        );
    });

    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
        Object.keys(headingInlineOverrides).forEach(tag => {
            heading.querySelectorAll(tag).forEach(node => {
                const currentStyle = node.getAttribute('style') || '';
                // Only apply overrides for properties the element doesn't already have
                const overrideParts = headingInlineOverrides[tag].split(';').filter(p => p.trim());
                const newParts = overrideParts.filter(part => {
                    const prop = part.split(':')[0].trim();
                    return !currentStyle.includes(prop + ':');
                });
                if (newParts.length) {
                    node.setAttribute('style', `${currentStyle}; ${newParts.join(';')}`);
                }
            });
        });
    });

    if (styleMap.blockquote?.color) {
        const bqColor = styleMap.blockquote.color.replace(/\s*!important\s*/g, '');
        doc.querySelectorAll('blockquote, blockquote p, blockquote li, blockquote strong, blockquote em, blockquote a, blockquote code, blockquote span').forEach(node => {
            const currentStyle = node.getAttribute('style') || '';
            // Skip elements that already have their own color (e.g. strong with accent color)
            if (currentStyle.includes('color:')) return;
            node.setAttribute('style', `${currentStyle}; color: ${bqColor} !important;`);
        });
    }

    // Unify image look-and-feel across themes.
    const imgRadius = styleMap.img?.['border-radius'] || '14px';
    const imgMargin = styleMap.img?.margin || '30px auto';
    const imgMaxWidth = styleMap.img?.['max-width'] || '100%';
    const imgPadding = styleMap.img?.padding || '0';
    const imgBorder = styleMap.img?.border || 'none';
    const imgShadow = styleMap.img?.['box-shadow'] || 'none';
    const imgBgColor = styleMap.img?.['background-color'] || '';

    // Apply max-width to grid/carousel containers so they shrink with the setting
    doc.querySelectorAll('.image-grid, .image-carousel').forEach(el => {
        const currentStyle = el.getAttribute('style') || '';
        el.setAttribute('style', `${currentStyle}; max-width: ${imgMaxWidth}; margin-left: auto; margin-right: auto;`);
    });

    doc.querySelectorAll('img').forEach(img => {
        const inGrid = Boolean(img.closest('.image-grid'));
        const inCarousel = Boolean(img.closest('.image-carousel'));
        const currentStyle = img.getAttribute('style') || '';
        const bgStyle = imgBgColor ? `background-color:${imgBgColor};` : '';
        let appendedStyle: string;
        if (inGrid) {
            appendedStyle = `display:block; max-width:100%; height:auto; margin:0; padding:${imgPadding}; border-radius:${imgRadius}; box-sizing:border-box; box-shadow:${imgShadow}; border:${imgBorder}; ${bgStyle}`;
        } else if (inCarousel) {
            appendedStyle = `display:block; width:100%; max-width:100%; height:auto; margin:0; padding:${imgPadding}; border-radius:${imgRadius}; box-sizing:border-box; box-shadow:${imgShadow}; border:${imgBorder}; ${bgStyle}`;
        } else {
            appendedStyle = `display:block; max-width:${imgMaxWidth}; height:auto; margin:${imgMargin}; margin-left:auto; margin-right:auto; padding:${imgPadding}; border-radius:${imgRadius}; box-sizing:border-box; box-shadow:${imgShadow}; border:${imgBorder}; ${bgStyle}`;
        }
        img.setAttribute('style', `${currentStyle}; ${appendedStyle}`);
    });

    const container = doc.createElement('div');
    container.setAttribute('style', styleDeclarationToString(styleMap.container));
    container.innerHTML = doc.body.innerHTML;

    return container.outerHTML;
}
