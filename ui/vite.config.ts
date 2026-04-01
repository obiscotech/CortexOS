import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/connectors': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/learning': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/cortex': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
