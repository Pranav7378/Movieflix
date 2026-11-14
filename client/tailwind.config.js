/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                cinecue: {
                    bg: '#07080B',
                    'bg-elevated': '#0D1017',
                    surface: '#111520',
                    'surface-light': '#1A202E',
                    
                    border: 'rgba(255, 255, 255, 0.08)',
                    'border-highlight': 'rgba(255, 255, 255, 0.16)',
                    
                    cyan: '#06B6D4',
                    'cyan-glow': '#22D3EE',
                    violet: '#8B5CF6',
                    'violet-glow': '#A78BFA',
                    emerald: '#10B981',
                    amber: '#F59E0B',
                    rose: '#F43F5E',
                    
                    text: '#F8FAFC',
                    muted: '#94A3B8',
                    'muted-dark': '#64748B',

                    'light-bg': '#F8FAFC',
                    'light-surface': '#FFFFFF',
                    'light-border': 'rgba(0, 0, 0, 0.08)',
                    'light-text': '#0F172A',
                    'light-muted': '#64748B',
                },
                netflix: {
                    red: '#06B6D4',
                    black: '#07080B',
                    gray: {
                        dark: '#0D1017',
                        medium: '#111520',
                        light: '#94A3B8'
                    }
                }
            },
            fontFamily: {
                sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
                display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
            },
            aspectRatio: {
                'poster': '2 / 3',
            },
            boxShadow: {
                'glow-cyan': '0 0 30px -5px rgba(6, 182, 212, 0.45)',
                'glow-cyan-sm': '0 0 15px -3px rgba(6, 182, 212, 0.3)',
                'glow-violet': '0 0 30px -5px rgba(139, 92, 246, 0.45)',
                'glow-violet-sm': '0 0 15px -3px rgba(139, 92, 246, 0.3)',
                'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
                'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
                'glow-ambient': '0 10px 40px -10px rgba(6, 182, 212, 0.2), 0 0 25px -2px rgba(139, 92, 246, 0.15)',
                'glass-card': '0 15px 35px -5px rgba(0, 0, 0, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)',
                'glass-card-light': '0 15px 35px -5px rgba(15, 23, 42, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.8)',
            },
            backgroundImage: {
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.01) 100%)',
                'glass-gradient-light': 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
                'accent-gradient': 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)',
                'accent-glow': 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.15) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 100%)',
            }
        },
    },
    plugins: [],
}
