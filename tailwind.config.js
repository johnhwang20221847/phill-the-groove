export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'Courier New', 'monospace'],
        body: ['"Inter"', 'sans-serif'],
      },
      colors: {
        groove: {
          cream: '#F2EDE4',
          paper: '#E8DFD0',
          dust:  '#C9B99A',
          vinyl: '#1A1410',
          brown: '#3D2B1F',
          red:   '#C0392B',
          amber: '#D48B2A',
          label: '#7B5C3E',
        }
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
