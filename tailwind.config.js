/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                paper: '#F4F1EB',
                surface: {
                    DEFAULT: '#FEFCF9',
                    dim: '#ECE9E2',
                    editor: '#FAF8F4',
                },
                ink: {
                    DEFAULT: '#292524',
                    soft: '#44403C',
                    muted: '#78716C',
                    faint: '#A8A29E',
                    ghost: '#D6D3CD',
                },
                rule: {
                    DEFAULT: '#DAD7CF',
                    light: '#E8E5DE',
                    faint: '#F0EDE7',
                },
                btn: {
                    fill: '#292524',
                    'fill-hover': '#1C1917',
                    text: '#FEFCF9',
                    success: '#4D7C5B',
                },
            },
            boxShadow: {
                'sm': '0 1px 2px rgba(41, 37, 36, 0.04)',
                'md': '0 2px 8px rgba(41, 37, 36, 0.05)',
                'page': '0 1px 3px rgba(41, 37, 36, 0.03), 0 8px 28px rgba(41, 37, 36, 0.05)',
            },
            fontFamily: {
                display: [
                    '"Crimson Pro"',
                    '"Noto Serif SC"',
                    'Georgia',
                    'serif',
                ],
                sans: [
                    '"DM Sans"',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    '"PingFang SC"',
                    '"Segoe UI"',
                    'sans-serif',
                ],
                mono: [
                    '"JetBrains Mono"',
                    '"Fira Code"',
                    'Consolas',
                    'monospace',
                ],
            },
        },
    },
    plugins: [],
}
