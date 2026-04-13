import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 1. Heavy 3D/Animation Libraries
            if (id.includes('three')) return 'vendor-three';
            if (id.includes('lottie-web')) return 'vendor-lottie';
            if (id.includes('gsap')) return 'vendor-gsap';
            if (id.includes('framer-motion')) return 'vendor-motion';
            
            // 2. React Core Ecosystem
            if (id.includes('react/') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react-core';
            }

            // 3. Data Fetching & State Management
            if (id.includes('@tanstack/react-query') || id.includes('axios')) {
              return 'vendor-api';
            }

            // 4. Icons (Lucide etc.)
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }

            // Note: Humne aakhir mein `return 'vendor'` hata diya hai. 
            // Ab Rollup baaki bachi hui choti libraries ko apne hisaab se smartly split kar lega.
          }
        }
      }
    },
    // Warning limit ko 1000 KB (1MB) set karna theek hai
    chunkSizeWarningLimit: 1000
  }
})