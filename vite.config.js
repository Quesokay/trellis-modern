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
        entry: 'src/index.js', // This will output to dist-electron/index.js
        vite: {
          build: {
            rollupOptions: {
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
      },
      {
        // Context Bridge (Preload script)
        entry: 'src/preload.js',
        onstart(options) {
          options.reload()
        },
      },
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