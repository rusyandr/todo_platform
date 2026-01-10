import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/todo_platform/' : '/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true,
  },
}));