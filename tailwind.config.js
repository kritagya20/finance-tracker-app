/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          app: 'var(--bg-app)',
          card: 'var(--bg-card)',
          'card-subtle': 'var(--bg-card-subtle)',
          'card-hover': 'var(--bg-card-hover)',
          input: 'var(--bg-input)',
          elevated: 'var(--bg-elevated)',
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          border: 'var(--border-subtle)',
          divider: 'var(--border-divider)',
        },
        slate: {
          950: '#020617',
          900: '#0f172a',
          850: '#131d35',
          800: '#1e293b',
          700: '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      transitionTimingFunction: {
        'emphasized': 'cubic-bezier(0.2, 0, 0, 1)',
        'emphasized-decel': 'cubic-bezier(0, 0, 0, 1)',
        'emphasized-accel': 'cubic-bezier(0.3, 0, 0.8, 0.15)',
        'standard': 'cubic-bezier(0.2, 0, 0, 1)',
        'standard-decel': 'cubic-bezier(0, 0, 0, 1)',
        'standard-accel': 'cubic-bezier(0.3, 0, 1, 1)',
      },
      transitionDuration: {
        'instant': '100ms',
        'fast': '150ms',
        'normal': '200ms',
        'moderate': '300ms',
        'slow': '400ms',
        'deliberate': '500ms',
      },
      maxWidth: {
        'mobile': '390px',
      }
    },
  },
  plugins: [],
}
