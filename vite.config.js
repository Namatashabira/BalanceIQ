import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isElectron = process.env.VITE_ELECTRON === 'true';

export default defineConfig({
  base: isElectron ? './' : '/BalanceIQ/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      output: {}
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
