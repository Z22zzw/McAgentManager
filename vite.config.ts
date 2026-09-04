import { defineConfig } from 'vite'

export default defineConfig({
  root: 'docs/prototype',
  server: { host: '127.0.0.1', port: 5174, proxy: { '/api': 'http://127.0.0.1:8787' } },
  build: { outDir: '../../dist/prototype', emptyOutDir: true },
})
