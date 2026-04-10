/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./playground.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#131313',
          lowest: '#0e0e0e',
          dim: '#131313',
          container: '#201f1f',
          'container-low': '#1a1919',
          'container-high': '#3a3a3a',
          'container-highest': '#454545',
        },
        primary: {
          DEFAULT: '#aec6ff',
          container: '#0070f3',
          foreground: '#131313',
        },
        secondary: {
          DEFAULT: '#6a6a6a',
          container: '#8a8a8a',
          foreground: '#e5e2e1',
        },
        tertiary: {
          DEFAULT: '#ffb596',
          foreground: '#131313',
        },
        error: {
          DEFAULT: '#ffb4ab',
          foreground: '#131313',
        },
        on: {
          surface: '#e5e2e1',
          'surface-variant': '#c4c1be',
        },
        outline: {
          variant: 'rgba(196, 193, 190, 0.5)',
        },
        'on-primary': '#131313',
      },
      borderColor: {
        DEFAULT: '#3a3a3a',
        'surface-container-high': '#4a4a4a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.75rem',
        'lg': '1rem',
      },
      backdropBlur: {
        'glass': '12px',
        'command': '20px',
      },
      boxShadow: {
        'ambient': '0 0 40px 0 rgba(229, 226, 225, 0.06)',
        'glow': '0 0 20px 0 rgba(174, 198, 255, 0.3)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}
