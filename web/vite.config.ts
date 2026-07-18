import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), 
    react(),
    wasm(),
    topLevelAwait(),
    nodePolyfills(),
  ],
  build: {
    target: 'esnext'
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
    include: [
      '@subsquid/scale-codec'
    ],
    exclude: [
      '@midnight-ntwrk/midnight-js-contracts',
      '@midnight-ntwrk/ledger-v8',
    ]
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
