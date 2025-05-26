import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../backend/public/build', // Outputs build to backend.old/public/build
    emptyOutDir: true, // Clears the directory before building
  },
});