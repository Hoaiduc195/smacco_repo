/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eefbf8',
          100: '#d6f4ec',
          200: '#afe9db',
          500: '#2fb79c',
          600: '#208f7c',
          700: '#1d7165',
          900: '#16453f',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          300: '#fdba74',
          500: '#f97316',
          600: '#ea580c',
        },
        base: {
          50: '#fbf8f3',
          100: '#f4efe6',
          200: '#e8dece',
          700: '#5f5549',
          900: '#221c17',
        },
        ink: {
          500: '#6b665e',
          700: '#38332d',
          900: '#191512',
        },
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      boxShadow: {
        soft: '0 18px 55px -32px rgba(34, 28, 23, 0.38)',
        card: '0 24px 70px -42px rgba(34, 28, 23, 0.48)',
        glow: '0 24px 70px -38px rgba(47, 183, 156, 0.55)',
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
