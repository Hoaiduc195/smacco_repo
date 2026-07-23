import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
    // Mapbox is intentionally isolated behind authenticated map routes.
    chunkSizeWarningLimit: 1900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('mapbox-gl') || id.includes('@mapbox')) return 'map';
          if (id.includes('firebase')) return 'firebase';
          if (id.includes('react')) return 'react';
          return undefined;
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
