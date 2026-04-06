import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './', // Ensure relative paths work across all pages
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        auth: resolve(__dirname, 'auth.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        notes: resolve(__dirname, 'notes.html'),
        planner: resolve(__dirname, 'planner.html'),
        chat: resolve(__dirname, 'chat.html'),
        timer: resolve(__dirname, 'timer.html')
      }
    }
  }
});
