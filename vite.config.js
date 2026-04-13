import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  // CRITICAL: Ensures assets are loaded with relative paths in the compiled Electron app
  base: './', 
  
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    electron([
      {
        // Main-Process entry file
        entry: 'src/index.js',
      },
      {
        // Context Bridge (Preload script)
        entry: 'src/preload.js',
        onstart(options) {
          options.reload()
        },
      },
    ]),
    renderer(),
  ],
  
  // Ensures Vite outputs the compiled React code exactly where electron-builder expects it
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})