import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  // CRITICAL: Ensures assets are loaded with relative paths in the compiled Electron app
  base: './', 
  
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    nodePolyfills({
      include: ['buffer'], // Only polyfill the buffer module
      globals: {
        Buffer: true, // Automatically inject window.Buffer
        global: true, // Automatically inject window.global
        process: true, // Automatically inject window.process
      },
    }),
    electron([
      {
        entry: 'src/index.js', // This will output to dist-electron/index.js
        vite: {
          build: {
            rollupOptions: {
              // 🚨 THE FIX: Tell Vite to ignore these optional C++ and ESM modules
              external: [
                'bufferutil', 
                'utf-8-validate', 
                'multicast-dns', 
                'ws',
                '@automerge/automerge',
                '@automerge/automerge-repo',
                '@automerge/automerge-repo-network-websocket'
              ],
            },
          },
        },
      },
      {
        entry: 'src/preload.js', // This will output to dist-electron/preload.js
        onstart(options) { options.reload() },
      }
      // REMOVED THE DUPLICATE PRELOAD SCRIPT BLOCK HERE
    ]),
    renderer({
      nodeIntegration: true,
    }),
  ],
  
  // Ensures Vite outputs the compiled React code exactly where electron-builder expects it
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})