/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['General Sans', 'DM Sans', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          900: '#831843',
        },
        accent: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          500: '#52525b',
          600: '#3f3f46',
          700: '#27272a',
        },
        base: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          700: '#52525b',
          900: '#18181b',
        },
        ink: {
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#09090b',
          950: '#030304',
        },
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      boxShadow: {
        soft: '0 12px 32px -20px rgba(9, 9, 11, 0.28)',
        card: '0 24px 64px -32px rgba(9, 9, 11, 0.30)',
        glow: '0 20px 48px -24px rgba(236, 72, 153, 0.42)',
      },
      spacing: {
        section: '5.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
