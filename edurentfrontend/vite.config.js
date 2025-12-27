import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    // Bundle analyzer - generates stats.html after build
    visualizer({
      filename: 'dist/stats.html',
      open: false, // Don't auto-open browser
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Manual chunking: Split vendor libraries into separate cached chunks
        manualChunks: {
          // React core - rarely changes, highly cacheable
          'vendor-react': ['react', 'react-dom'],
          
          // Router - separate chunk for navigation
          'vendor-router': ['react-router-dom'],
          
          // Supabase client - for real-time features
          'vendor-supabase': ['@supabase/supabase-js'],
          
          // HTTP & WebSocket libraries
          'vendor-network': ['axios', 'sockjs-client', 'stompjs'],
          
          // Utilities
          'vendor-utils': ['dompurify', 'browser-image-compression'],
        },
      },
    },
  },
  define: {
    global: 'window',
  },
})

