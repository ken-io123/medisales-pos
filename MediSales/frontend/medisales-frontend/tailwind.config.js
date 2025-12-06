/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#3B82F6', // Blue-500 (same as POS)
          secondary: '#2563EB', // Blue-600
          accent: '#60A5FA', // Blue-400 (lighter for accents)
          background: '#EFF6FF', // Blue-50
          surface: '#FFFFFF',
          muted: '#64748B', // Slate-500
          success: '#10B981', // Emerald-500
          warning: '#F59E0B', // Amber-500
          danger: '#EF4444', // Red-500
          info: '#06B6D4', // Cyan-500
        },
      },
      // Enhanced max-width for wider modern layouts
      maxWidth: {
        'container': '1600px', // Wider container for modern look
        '8xl': '88rem',
        '9xl': '96rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      // Modern spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      // Enhanced shadows for depth
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
        'md': '0 4px 8px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 8px 16px -2px rgba(0, 0, 0, 0.12)',
        'xl': '0 12px 24px -4px rgba(0, 0, 0, 0.15)',
        '2xl': '0 20px 32px -8px rgba(0, 0, 0, 0.18)',
        'card': '0 2px 12px 0 rgba(59, 130, 246, 0.08)', // Subtle blue shadow
        'card-hover': '0 4px 20px 0 rgba(59, 130, 246, 0.15)', // Enhanced on hover
        'button': '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        'inner-subtle': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      // Modern border radius
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
