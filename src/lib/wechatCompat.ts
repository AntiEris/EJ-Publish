import { buildTemplateStyleMap, getBundledTemplates, styleDeclarationToString } from './templates';
import type { TemplateDefinition } from './templates';

const IMAGE_PROXY_URL = 'https://tmpimg.ej-studio.app';

// Helper to convert images to Base64
async function getBase64Image(imgUrl: string): Promise<string> {
    try {
        if (imgUrl.startsWith('data:')) return imgUrl;

        const response = await fetch(imgUrl, { mode: 'cors', cache: 'default' });
        if (!response.ok) return imgUrl;

        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(imgUrl);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        return imgUrl;
    }
}

// Upload a base64 data URL to the image proxy, returns an https URL
async function uploadToImageProxy(dataUrl: string): Promise<string> {
    try {
        const contentTypeMatch = dataUrl.match(/^data:([^;]+);/);
        const contentType = contentTypeMatch ? contentTypeMatch[1] : 'image/png';

        const resp = await fetch(`${IMAGE_PROXY_URL}/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: dataUrl, contentType }),
        });
        if (!resp.ok) return dataUrl;

        const result = await resp.json() as { url?: string };
        return result.url || dataUrl;
    } catch {
        return dataUrl; // Fallback to base64 if proxy unavailable
    }
}

function resolveTemplate(templateOrId: TemplateDefinition | string): TemplateDefinition {
    if (typeof templateOrId !== 'string') return templateOrId;
    const templates = getBundledTemplates();
    return templates.find((template) => template.id === templateOrId) || templates[0];
}

export async function makeWeChatCompatible(html: string, templateOrId: TemplateDefinition | string): Promise<string> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const template = resolveTemplate(templateOrId);
    const styleMap = buildTemplateStyleMap(template);
    const containerStyle = styleDeclarationToString(styleMap.container);

    // 1. WeChat prefers <section> as the root wrapper for overall styling
    // If the root is a div, let's wrap or convert it to a section.
    const rootNodes = Array.from(doc.body.children);

    // Create new wrap section
    // 秀米 pattern: justify + break-word for better CJK mixed-content line breaking
    const section = doc.createElement('section');
    let finalContainerStyle = containerStyle;
    if (!finalContainerStyle.includes('text-align')) {
        finalContainerStyle += ' text-align: justify;';
    }
    if (!finalContainerStyle.includes('overflow-wrap') && !finalContainerStyle.includes('word-break')) {
        finalContainerStyle += ' overflow-wrap: break-word;';
    }
    section.setAttribute('style', finalContainerStyle);

    rootNodes.forEach(node => {
        // If the original html came from applyTheme it already has a root div
        // We strip it regardless of exact style string match to avoid double layers
        if (node.tagName === 'DIV' && rootNodes.length === 1) {
            Array.from(node.childNodes).forEach(child => section.appendChild(child));
        } else {
            section.appendChild(node);
        }
    });

    // 2a. Fix hr-decoration flex sections for WeChat.
    // WeChat supports display:flex but collapses empty/border-only elements.
    // Trick from professional WeChat publishing tools: insert a zero-width SVG
    // inside border-top containers to give them "content" without visual impact.
    const svgPlaceholder = '<svg viewBox="0 0 1 1" style="float:left;line-height:0;width:0;vertical-align:top;"></svg>';
    const hrDecorations = section.querySelectorAll('section.hr-decoration');
    hrDecorations.forEach(node => {
        const children = Array.from(node.children) as HTMLElement[];
        children.forEach(child => {
            const cs = child.getAttribute('style') || '';
            if (cs.includes('flex:')) {
                // Line element: wrap border-top in nested sections with SVG trick
                const borderMatch = cs.match(/border-top:\s*([^;]+)/);
                const borderTop = borderMatch ? borderMatch[1].trim() : '1px solid #ddd';
                child.setAttribute('style', 'display: inline-block; flex: 1 0 1px; width: auto; vertical-align: bottom; padding: 0px; box-sizing: border-box;');
                child.innerHTML = `<section style="margin: 0; box-sizing: border-box;"><section style="border-top: ${borderTop}; box-sizing: border-box;">${svgPlaceholder}</section></section>`;
            }
        });
    });

    // 2b. Convert image carousels to 秀米-style overflow-x swipe for WeChat.
    const carousels = section.querySelectorAll('section.image-carousel');
    carousels.forEach(carousel => {
        const images = Array.from(carousel.querySelectorAll('img'));
        const count = images.length;
        if (count === 0) return;

        // Read max-width from carousel container style
        const carouselStyle = carousel.getAttribute('style') || '';
        const maxWMatch = carouselStyle.match(/max-width:\s*([^;]+)/);
        const maxWidth = maxWMatch ? maxWMatch[1].trim() : '100%';
        const marginMatch = carouselStyle.match(/margin:\s*([^;]+)/);
        const margin = marginMatch ? marginMatch[1].trim() : '24px 0';

        // Read padding from the first image to determine gap
        const firstImg = images[0];
        const firstImgStyle = firstImg?.getAttribute('style') || '';
        const padMatch = firstImgStyle.match(/padding:\s*([^;]+)/);
        const imgPadVal = padMatch ? padMatch[1].trim() : '0';
        const pct = (100 / count).toFixed(4);

        // Build the wide strip — use font-size:0 to eliminate inline-block whitespace
        const strip = doc.createElement('section');
        strip.setAttribute('style', `overflow: hidden; width: ${count * 100}%; max-width: ${count * 100}% !important; font-size: 0; box-sizing: border-box;`);

        // Extract background-color from first image if set
        const bgMatch = firstImgStyle.match(/background-color:\s*([^;]+)/);
        const imgBg = bgMatch ? bgMatch[1].trim() : '';
        const radiusMatch = firstImgStyle.match(/border-radius:\s*([^;]+)/);
        const imgRad = radiusMatch ? radiusMatch[1].trim() : '0';

        images.forEach((img, i) => {
            const slide = doc.createElement('section');
            const slideBg = imgBg ? `background-color: ${imgBg};` : '';
            const slideRad = imgRad !== '0' ? `border-radius: ${imgRad};` : '';
            // Use float:left instead of inline-block (more reliable in WeChat, no whitespace issues)
            // 6px right-padding on all slides except last for consistent gap
            const slideRightPad = i < count - 1 ? 'padding-right: 6px;' : '';
            slide.setAttribute('style', `float: left; width: ${pct}%; ${slideRightPad} box-sizing: border-box;`);
            const imgWrap = doc.createElement('section');
            imgWrap.setAttribute('style', `text-align: center; line-height: 0; padding: ${imgPadVal}; ${slideBg} ${slideRad} box-sizing: border-box;`);
            img.setAttribute('style', 'vertical-align: middle; max-width: 100%; width: 100%; box-sizing: border-box;');
            imgWrap.appendChild(img);
            slide.appendChild(imgWrap);
            strip.appendChild(slide);
        });

        // Scrollable container
        const scrollable = doc.createElement('section');
        scrollable.setAttribute('style', 'display: inline-block; width: 100%; vertical-align: top; overflow-x: auto; box-sizing: border-box;');
        scrollable.appendChild(strip);

        // Outer clipping container with max-width
        const outer = doc.createElement('section');
        outer.setAttribute('style', `margin: ${margin}; width: ${maxWidth} !important; max-width: ${maxWidth} !important; margin-left: auto; margin-right: auto; overflow: hidden; box-sizing: border-box;`);
        outer.appendChild(scrollable);

        // Remove indicator dots that follow the carousel
        const dots = carousel.nextElementSibling;
        if (dots && (dots.getAttribute('style') || '').includes('gap: 6px')) {
            dots.remove();
        }
        carousel.parentNode?.replaceChild(outer, carousel);
    });

    // 2c. WeChat ignores flex in many scenarios. Convert image flex wrappers to table layout.
    const flexLikeNodes = section.querySelectorAll('div, p.image-grid');
    flexLikeNodes.forEach(node => {
        // Keep code block and carousel internals untouched.
        if (node.closest('pre, code, .image-carousel')) return;

        const style = node.getAttribute('style') || '';
        const isFlexNode = style.includes('display: flex') || style.includes('display:flex');
        const isImageGrid = node.classList.contains('image-grid');
        if (!isFlexNode && !isImageGrid) return;

        const flexChildren = Array.from(node.children);
        if (flexChildren.every(child => child.tagName === 'IMG' || child.querySelector('img'))) {
            const table = doc.createElement('table');
            table.setAttribute('style', 'width: 100%; table-layout: fixed; border-collapse: collapse; margin: 16px 0; border: none !important;');
            const tbody = doc.createElement('tbody');
            const tr = doc.createElement('tr');
            tr.setAttribute('style', 'border: none !important; background: transparent !important;');

            const colWidth = (100 / flexChildren.length).toFixed(2) + '%';
            flexChildren.forEach(child => {
                const td = doc.createElement('td');
                td.setAttribute('style', `width: ${colWidth}; padding: 0 4px; vertical-align: top; border: none !important; background: transparent !important;`);
                td.appendChild(child);
                // Update child width to 100% since it's now bound by TD
                if (child.tagName === 'IMG') {
                    const currentStyle = child.getAttribute('style') || '';
                    child.setAttribute('style', currentStyle.replace(/width:\s*[^;]+;?/g, '') + ' width: 100% !important; display: block; margin: 0 auto;');
                }
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
            table.appendChild(tbody);
            node.parentNode?.replaceChild(table, node);
        } else if (isFlexNode) {
            // Non-image flex items just get stripped of flex.
            node.setAttribute('style', style.replace(/display:\s*flex;?/g, 'display: block;'));
        }
    });

    // 3. Convert <strong>/<b> to <span style="font-weight:700"> (秀米 pattern).
    // WeChat's save/preview may strip or reset styles on semantic bold tags.
    section.querySelectorAll('strong, b').forEach(el => {
        if (el.closest('pre')) return;
        const span = doc.createElement('span');
        span.innerHTML = el.innerHTML;
        const existingStyle = el.getAttribute('style') || '';
        span.setAttribute('style', `font-weight: 700; ${existingStyle}`.trim());
        el.replaceWith(span);
    });

    // 3b. List Item normalization (秀米 pattern).
    // Ensure all <li> content is wrapped in <p>. Without this, inline <span>
    // with padding/background inside bare <li> gets treated as block by WeChat.
    section.querySelectorAll('li').forEach(li => {
        const firstChild = li.firstElementChild;
        if (!firstChild || firstChild.tagName !== 'P') {
            // Bare content — wrap in <p>
            const p = doc.createElement('p');
            p.setAttribute('style', 'margin: 0; padding: 0;');
            while (li.firstChild) p.appendChild(li.firstChild);
            li.appendChild(p);
        }
    });

    // 3c. Convert ALL <blockquote> to <section> BEFORE force-inheritance.
    // Strip properties that 秀米 doesn't keep on the blockquote section:
    // box-shadow, border-radius, text-align, line-height.
    // These extra props may trigger WeChat's save cleanup on child elements.
    section.querySelectorAll('blockquote').forEach(bq => {
        const replacement = doc.createElement('section');
        replacement.innerHTML = bq.innerHTML;
        const style = (bq.getAttribute('style') || '')
            .replace(/box-shadow:\s*[^;]+;?\s*/g, '')
            .replace(/border-radius:\s*[^;]+;?\s*/g, '')
            .replace(/text-align:\s*[^;]+;?\s*/g, '')
            .replace(/line-height:\s*[^;]+;?\s*/g, '');
        replacement.setAttribute('style', style);
        bq.replaceWith(replacement);
    });

    // 4. Force Inheritance
    // WeChat's editor aggressively overrides inherited fonts on <p>, <li>, etc.
    // So we manually distribute the container's font properties to all individual blocks.
    const colorMatch = containerStyle.match(/color:\s*([^;]+);/);
    const lineHeightMatch = containerStyle.match(/line-height:\s*([^;]+);/);

    // We only enforce on specific text tags that WeChat likes to hijack
    const textNodes = section.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote, span');
    textNodes.forEach(node => {
        // Preserve code highlighting tokens inside code blocks.
        if (node.tagName === 'SPAN' && node.closest('pre, code')) return;

        let currentStyle = node.getAttribute('style') || '';

        // 秀米 pattern: only distribute line-height and color.
        // font-family and font-size are ONLY on the root container — children inherit.
        // Adding extra props to spans/p triggers WeChat's save cleanup.
        if (lineHeightMatch && !currentStyle.includes('line-height:')) {
            currentStyle += ` line-height: ${lineHeightMatch[1]};`;
        }
        if (colorMatch && !currentStyle.includes('color:')) {
            currentStyle += ` color: ${colorMatch[1]};`;
        }

        // 秀米 pattern: text-wrap-mode + explicit padding on <p>.
        if (node.tagName === 'P' && !node.closest('pre')) {
            if (!currentStyle.includes('text-wrap-mode') && !currentStyle.includes('white-space')) {
                currentStyle += ' text-wrap-mode: wrap;';
            }
            if (!currentStyle.includes('padding')) {
                currentStyle += ' padding: 0px;';
            }
        }

        node.setAttribute('style', currentStyle.trim());
    });

    // Keep CJK punctuation attached to preceding inline emphasis in WeChat.
    // Example: <strong>标题</strong>：说明 -> <strong>标题：</strong>说明
    const inlineNodes = section.querySelectorAll('em, span, a, code');
    inlineNodes.forEach(node => {
        const next = node.nextSibling;
        if (!next || next.nodeType !== Node.TEXT_NODE) return;
        const text = next.textContent || '';
        const match = text.match(/^\s*([：；，。！？、:])(.*)$/s);
        if (!match) return;

        const punct = match[1];
        const rest = match[2] || '';
        node.appendChild(doc.createTextNode(punct));
        if (rest) {
            next.textContent = rest;
        } else {
            next.parentNode?.removeChild(next);
        }
    });

    // 5. Preserve whitespace in code blocks for WeChat.
    // WeChat collapses spaces around inline <span> elements even inside <pre>.
    // Replace regular spaces with &nbsp; in code text nodes.
    section.querySelectorAll('pre code').forEach(code => {
        const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
        let node: Text | null;
        while ((node = walker.nextNode() as Text | null)) {
            if (node.textContent && node.textContent.includes(' ')) {
                node.textContent = node.textContent.replace(/ /g, '\u00a0');
            }
        }
    });

    // 6. Allow inline <code> to break across lines in WeChat.
    // Without this, text-align:justify stretches surrounding text when
    // a long inline code element can't wrap.
    section.querySelectorAll('code').forEach(code => {
        if (code.closest('pre')) return;
        const style = code.getAttribute('style') || '';
        code.setAttribute('style', style + ' word-break: break-all;');
    });

    // 7. Fix Mac-style code block dots: WeChat collapses empty inline-block
    // elements. Insert zero-width SVG placeholders to prevent collapse.
    section.querySelectorAll('pre > div').forEach(div => {
        const style = div.getAttribute('style') || '';
        if (!style.includes('white-space: nowrap')) return;
        div.querySelectorAll('span').forEach(span => {
            const spanStyle = span.getAttribute('style') || '';
            if (spanStyle.includes('border-radius: 50%') && !span.innerHTML.trim()) {
                span.innerHTML = svgPlaceholder;
            }
        });
    });

    // (blockquote→section moved to step 3c, before force-inheritance)

    // 8. Convert text-decoration sub-properties to shorthand for WeChat.
    // WeChat's WebKit ignores text-decoration-style/color/line individually.
    section.querySelectorAll('u').forEach(u => {
        const style = u.getAttribute('style') || '';
        const lineMatch = style.match(/text-decoration-line:\s*([^;]+)/);
        const styleMatch = style.match(/text-decoration-style:\s*([^;]+)/);
        const colorMatch2 = style.match(/text-decoration-color:\s*([^;]+)/);
        const offsetMatch = style.match(/text-underline-offset:\s*([^;]+)/);

        if (lineMatch || styleMatch || colorMatch2) {
            const line = lineMatch ? lineMatch[1].trim() : 'underline';
            const decoStyle = styleMatch ? styleMatch[1].trim() : 'solid';
            const decoColor = colorMatch2 ? colorMatch2[1].trim() : '';
            const shorthand = `${line} ${decoStyle}${decoColor ? ` ${decoColor}` : ''}`;

            let newStyle = style
                .replace(/text-decoration-line:\s*[^;]+;?\s*/g, '')
                .replace(/text-decoration-style:\s*[^;]+;?\s*/g, '')
                .replace(/text-decoration-color:\s*[^;]+;?\s*/g, '');

            // text-underline-offset is not supported in WeChat, remove it
            if (offsetMatch) {
                newStyle = newStyle.replace(/text-underline-offset:\s*[^;]+;?\s*/g, '');
            }

            newStyle = `text-decoration: ${shorthand}; ${newStyle}`.trim();
            u.setAttribute('style', newStyle);
        }
    });

    // 9. Convert hex colors to rgb() format (秀米 pattern).
    // WeChat's save/preview may handle rgb() more reliably than hex.
    section.querySelectorAll('*').forEach(el => {
        const style = el.getAttribute('style');
        if (style && style.includes('#')) {
            el.setAttribute('style', style.replace(/#([0-9a-fA-F]{6})\b/g, (_, hex) => {
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);
                return `rgb(${r}, ${g}, ${b})`;
            }).replace(/#([0-9a-fA-F]{3})\b/g, (_, hex) => {
                const r = parseInt(hex[0] + hex[0], 16);
                const g = parseInt(hex[1] + hex[1], 16);
                const b = parseInt(hex[2] + hex[2], 16);
                return `rgb(${r}, ${g}, ${b})`;
            }));
        }
    });
    // Also convert on root section
    const rootStyleHex = section.getAttribute('style') || '';
    if (rootStyleHex.includes('#')) {
        section.setAttribute('style', rootStyleHex.replace(/#([0-9a-fA-F]{6})\b/g, (_, hex) => {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `rgb(${r}, ${g}, ${b})`;
        }).replace(/#([0-9a-fA-F]{3})\b/g, (_, hex) => {
            const r = parseInt(hex[0] + hex[0], 16);
            const g = parseInt(hex[1] + hex[1], 16);
            const b = parseInt(hex[2] + hex[2], 16);
            return `rgb(${r}, ${g}, ${b})`;
        }));
    }

    // 10. Universal box-sizing: border-box (秀米 pattern).
    // Prevents WeChat from calculating padding/border differently.
    section.querySelectorAll('*').forEach(el => {
        const style = el.getAttribute('style') || '';
        if (!style.includes('box-sizing')) {
            el.setAttribute('style', style ? `${style}; box-sizing: border-box;` : 'box-sizing: border-box;');
        }
    });
    // Also ensure the root section itself has it
    const rootStyle = section.getAttribute('style') || '';
    if (!rootStyle.includes('box-sizing')) {
        section.setAttribute('style', `${rootStyle}; box-sizing: border-box;`);
    }

    // 10. Enforce image max-width with !important for WeChat
    section.querySelectorAll('img').forEach(img => {
        const style = img.getAttribute('style') || '';
        const maxWidthMatch = style.match(/max-width:\s*([^;]+)/);
        if (maxWidthMatch) {
            const maxW = maxWidthMatch[1].trim();
            img.setAttribute('style', style.replace(/max-width:\s*[^;]+;?/, `max-width: ${maxW} !important;`));
        }
    });

    // 11. Process images for WeChat pasting.
    // Public https:// URLs are kept as-is — WeChat will fetch and re-host them.
    // Local/relative/localhost URLs → convert to base64 → upload to image proxy → get https URL.
    // If image proxy is unavailable, falls back to base64 (which won't survive WeChat save).
    const imgs = Array.from(section.querySelectorAll('img'));
    await Promise.all(imgs.map(async img => {
        const src = img.getAttribute('src');
        if (!src) return;

        const isPublicUrl = /^https?:\/\//.test(src)
            && !src.includes('localhost')
            && !src.includes('127.0.0.1');

        if (isPublicUrl) return; // WeChat can fetch these directly

        // Get base64 version (already base64 or convert from local)
        const base64 = src.startsWith('data:') ? src : await getBase64Image(src);
        if (!base64.startsWith('data:')) return; // conversion failed, keep original

        // Upload to image proxy for a public https URL
        const proxyUrl = await uploadToImageProxy(base64);
        img.setAttribute('src', proxyUrl);
    }));

    doc.body.innerHTML = '';
    doc.body.appendChild(section);

    // Prevent WeChat from breaking lines between inline emphasis and leading CJK punctuation.
    // Example: </strong>： should stay on the same line.
    let outputHtml = doc.body.innerHTML;
    outputHtml = outputHtml.replace(/(<\/(?:em|span|a|code)>)\s*([：；，。！？、])/g, '$1\u2060$2');

    return outputHtml;
}
