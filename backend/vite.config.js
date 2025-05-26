import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../backend/public', // output straight into Laravel's public folder
    emptyOutDir: true,           // clear old files before building
  },
});
