/**
 * Image store backed by sessionStorage.
 *
 * Pasted images are stored as full data-URLs keyed by a short ID.
 * The editor textarea only holds lightweight references like:
 *
 *     ![图片](imgstore://a1b2c3d4)
 *
 * Before rendering, `resolveImageRefs()` expands these back into real
 * data-URLs so the rest of the pipeline (markdown-it, applyTheme,
 * wechatCompat) works unchanged.
 *
 * Each image is stored as its own sessionStorage entry (key: `imgstore:ID`)
 * so that we never hit the per-item size limit with a single giant JSON blob.
 */

const SCHEME = 'imgstore://';
const STORAGE_PREFIX = 'imgstore:';
const INDEX_KEY = 'imgstore:__index';

// In-memory cache to avoid repeated sessionStorage reads during rendering.
const cache = new Map<string, string>();

let counter = 0;

function loadIndex(): string[] {
    try {
        const raw = sessionStorage.getItem(INDEX_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveIndex(ids: string[]) {
    try { sessionStorage.setItem(INDEX_KEY, JSON.stringify(ids)); } catch { /* full */ }
}

// Hydrate in-memory cache from sessionStorage on module load.
(function hydrate() {
    for (const id of loadIndex()) {
        try {
            const data = sessionStorage.getItem(STORAGE_PREFIX + id);
            if (data) cache.set(id, data);
        } catch { /* ignore */ }
    }
})();

function generateId(): string {
    counter++;
    const timestamp = Date.now().toString(36);
    const seq = counter.toString(36);
    return `${timestamp}${seq}`;
}

/** Store a data-URL and return a short imgstore:// reference. */
export function storeImage(dataUrl: string): string {
    // Avoid duplicates
    for (const [id, existing] of cache) {
        if (existing === dataUrl) return `${SCHEME}${id}`;
    }
    const id = generateId();
    cache.set(id, dataUrl);

    // Persist
    try { sessionStorage.setItem(STORAGE_PREFIX + id, dataUrl); } catch { /* full */ }
    const index = loadIndex();
    index.push(id);
    saveIndex(index);

    return `${SCHEME}${id}`;
}

/** Resolve a single imgstore:// URL to its data-URL, or return the input unchanged. */
export function resolveImageUrl(url: string): string {
    if (!url.startsWith(SCHEME)) return url;
    const id = url.slice(SCHEME.length);
    return cache.get(id) || url;
}

/** Replace all imgstore:// references in a Markdown string with real data-URLs. */
export function resolveImageRefs(markdown: string): string {
    return markdown.replace(/imgstore:\/\/[a-z0-9]+/g, (match) => resolveImageUrl(match));
}

/** Check whether a URL is an imgstore reference. */
export function isImageStoreRef(url: string): boolean {
    return url.startsWith(SCHEME);
}

/** Get the number of stored images (useful for debugging). */
export function getStoreSize(): number {
    return cache.size;
}

/** Clear all stored images. */
export function clearStore(): void {
    for (const id of loadIndex()) {
        try { sessionStorage.removeItem(STORAGE_PREFIX + id); } catch { /* ignore */ }
    }
    try { sessionStorage.removeItem(INDEX_KEY); } catch { /* ignore */ }
    cache.clear();
    counter = 0;
}
