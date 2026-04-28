/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#1D4ED8',
                    light: '#3B82F6',
                    lighter: '#60A5FA',
                    dark: '#1E40AF',
                    50: '#EFF6FF',
                    100: '#DBEAFE',
                    500: '#3B82F6',
                    600: '#2563EB',
                    700: '#1D4ED8',
                    800: '#1E40AF',
                    900: '#1E3A8A',
                },
                'primary-container': {
                    DEFAULT: '#1D4ED8',
                    light: '#3B82F6',
                    dark: '#1E40AF',
                },
                profit: '#16A34A',
                profitLight: '#22C55E',
                loss: '#DC2626',
                lossLight: '#EF4444',
                warning: '#D97706',
                warningLight: '#F59E0B',
            },
            fontSize: {
                'page-title': ['24px', { lineHeight: '32px', fontWeight: '600' }],
                'section-header': ['18px', { lineHeight: '24px', fontWeight: '500' }],
                'table-header': ['13px', { lineHeight: '16px', fontWeight: '500' }],
                'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
            },
            backgroundColor: {
                'table-header': '#EFF6FF',
                'table-alt': '#F8FAFC',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'slide-in-left': 'slideInLeft 0.4s ease-out',
                'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
                'typing': 'typing 3.5s steps(40, end), blink 0.75s step-end infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideInLeft: {
                    '0%': { transform: 'translateX(-100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                pulseSubtle: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                typing: {
                    '0%': { width: '0' },
                    '100%': { width: '100%' },
                },
                blink: {
                    '0%, 100%': { borderColor: 'transparent' },
                    '50%': { borderColor: 'currentColor' },
                },
            },
        },
    },
    plugins: [],
}