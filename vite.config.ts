import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/sanctum': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // Sitemap proxy for SEO
      '/sitemap.xml': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/sitemap-static.xml': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/sitemap-cities.xml': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/sitemap-salons.xml': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/sitemap-staff.xml': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/sitemap-services.xml': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          icons: ['lucide-react'],
          http: ['axios'],
        },
      },
    },
  },
});