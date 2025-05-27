import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',  // Ensure output goes to dist/
    rollupOptions: {
      input: {
        main: './src/main.jsx',  // Use root index.html as template
      },
    },
  },
});