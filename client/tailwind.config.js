/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cinecue: {
                    bg: '#101114',
                    'bg-secondary': '#17191F',
                    surface: '#1B1D23',
                    'surface-light': '#242730',
                    amber: '#E5A45C',
                    'amber-hover': '#f0b36f',
                    crimson: '#D93643',
                    'crimson-hover': '#e44c59',
                    text: '#F5F5F5',
                    muted: '#A1A1AA',
                    'muted-dark': '#71717A',
                    border: '#303139',
                    'border-light': '#3F414D',
                },
                // Backwards compatibility aliases
                netflix: {
                    red: '#E5A45C', // mapped to amber for unified brand
                    black: '#101114',
                    gray: {
                        dark: '#17191F',
                        medium: '#1B1D23',
                        light: '#A1A1AA'
                    }
                }
            },
            fontFamily: {
                sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
            },
            aspectRatio: {
                'poster': '2 / 3',
            },
            boxShadow: {
                'amber-glow': '0 0 25px -5px rgba(229, 164, 92, 0.25)',
                'card': '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
                'surface': '0 4px 20px rgba(0, 0, 0, 0.5)',
            }
        },
    },
    plugins: [],
}
