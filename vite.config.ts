import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';
import compression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
    hmr: { overlay: false },
    headers: {
      'Cross-Origin-Opener-Policy':   'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },

  plugins: [
    react(),
    mode === 'development' && componentTagger(),

    // Brotli compression
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),

    // Gzip fallback
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
    }),
  ].filter(Boolean),

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },

  // WASM support
  assetsInclude: ['**/*.wasm'],

  worker: {
    format: 'es',
  },

  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-query':  ['@tanstack/react-query'],
          'vendor-motion': ['framer-motion'],
          'vendor-three':  ['three'],
          'vendor-gsap':   ['gsap'],
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-scroll-area',
          ],
          'vendor-icons':  ['lucide-react'],
          'vendor-utils':  ['clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
  },

  optimizeDeps: {
    exclude: ['@/workers/marketWorker'],
  },
}));
