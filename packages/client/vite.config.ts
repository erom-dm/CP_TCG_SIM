import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Resolve the shared workspace package directly from source
      shared: path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});
