import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isElectron = process.env.VITE_ELECTRON === 'true';

export default defineConfig({
  base: isElectron ? './' : '/BalanceIQ/',
  plugins: [
    react({
      // Disable FastRefresh for now to avoid RefreshRuntime errors
      fastRefresh: false
    })
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    hmr: {
      host: '127.0.0.1',
      port: 5173,
      protocol: 'ws',
      // For dev server behind a proxy or with a base path, don't include the path in HMR
      path: '/hmr'
    }
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
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['chart.js', 'react-chartjs-2', 'recharts'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'react-icons', '@heroicons/react'],
          'vendor-antd': ['antd', '@ant-design/icons'],
          'vendor-utils': ['axios', 'fuse.js', 'jspdf', 'xlsx'],
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
