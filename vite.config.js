import { defineConfig } from 'vite'

// Static landing page for Diffly. No framework — plain HTML/CSS/JS bundled by Vite.
export default defineConfig({
  server: {
    port: 5180,
    open: true,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
})
