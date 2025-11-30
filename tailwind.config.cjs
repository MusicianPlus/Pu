/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: 'var(--bg-app)',
        panel: 'var(--bg-panel)',
        input: 'var(--bg-input)',
        border: 'var(--border)',
        txt: 'var(--text-main)',
        dim: 'var(--text-dim)',
        
        sig: 'var(--c-sig)',
        math: 'var(--c-math)',
        geo: 'var(--c-geo)',
        mat: 'var(--c-mat)',
        obj: 'var(--c-obj)',
        tex: 'var(--c-tex)',
        snd: 'var(--c-snd)',
        fx: 'var(--c-fx)',
      }
    },
  },
  plugins: [],
}