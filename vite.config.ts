import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': { target: 'http://localhost:5000', changeOrigin: true, secure: false },
        '/ai':  { target: 'http://localhost:8000', changeOrigin: true, secure: false }
      }
    },
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, '.') } },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-charts': ['recharts'],
            'vendor-maps': ['leaflet', 'react-leaflet'],
            'vendor-motion': ['framer-motion'],
            'vendor-icons': ['lucide-react'],
          }
        }
      }
    }
  };
});
