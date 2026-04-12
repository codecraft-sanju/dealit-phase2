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
            // Three.js ko alag tukde mein tod do
            if (id.includes('three')) {
              return 'vendor-three';
            }
            // Lottie ko alag chunk mein daal do
            if (id.includes('lottie-web')) {
              return 'vendor-lottie';
            }
            // GSAP (animations) ko alag kar do
            if (id.includes('gsap')) {
              return 'vendor-gsap';
            }
            // Baaki saari libraries ek generic vendor file mein
            return 'vendor';
          }
        }
      }
    },
    // Warning limit ko 1MB kar dete hain taaki choti warnings tang na karein
    chunkSizeWarningLimit: 1000
  }
})