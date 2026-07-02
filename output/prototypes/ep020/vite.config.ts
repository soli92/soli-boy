import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const parentModules = path.resolve(__dirname, '../../packages/app/node_modules');

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    // Follow symlinks so the node_modules symlink resolves correctly
    preserveSymlinks: false,
    // Dedupe React to avoid multiple instances through symlink
    dedupe: ['react', 'react-dom', '@radix-ui/react-accordion'],
  },
  server: {
    fs: {
      // Allow Vite dev server to serve files from parent node_modules
      allow: [__dirname, parentModules],
      strict: false,
    },
  },
  build: {
    outDir: path.join(__dirname, 'dist'),
    emptyOutDir: true,
  },
  optimizeDeps: {
    // Pre-bundle from the symlinked node_modules
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-select',
      '@radix-ui/react-slider',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toggle-group',
    ],
  },
});
