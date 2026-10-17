import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          base: '#0b0f19',
        },
        surface: {
          card: '#111827',
          subdued: '#1e293b',
        },
        border: {
          hairline: '#1f2937',
          active: '#374151',
        },
        text: {
          primary: '#f9fafb',
          secondary: '#9ca3af',
          muted: '#6b7280',
        },
        status: {
          healthy: {
            fg: '#10b981',
            bg: '#064e3b',
            border: '#065f46',
          },
          drift: {
            fg: '#ef4444',
            bg: '#4c0519',
            border: '#9f1239',
          },
          warning: {
            fg: '#f59e0b',
            bg: '#451a03',
            border: '#92400e',
          },
          accent: {
            fg: '#38bdf8',
            bg: '#0c4a6e',
            border: '#0284c7',
          },
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config
