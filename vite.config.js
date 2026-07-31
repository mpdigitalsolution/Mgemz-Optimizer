import { defineConfig } from 'vite'
import { copyFileSync, cpSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

function copyExtensionRuntime() {
  return {
    name: 'copy-extension-runtime',
    closeBundle() {
      const output = resolve('dist')
      mkdirSync(output, { recursive: true })
      for (const file of ['manifest.json', 'background.js', 'editor-adapter.js', 'content.js', 'content.css', 'popup.js']) {
        copyFileSync(resolve(file), resolve(output, file))
      }
      cpSync(resolve('icons'), resolve(output, 'icons'), { recursive: true })
    }
  }
}

export default defineConfig({
  plugins: [copyExtensionRuntime()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    include: ['**/*.test.js']
  },
  server: {
    port: 3000,
    open: '/popup.html'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'popup.html',
        landing: 'landing.html'
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@services': '/src/services',
      '@database': '/src/database',
      '@utils': '/src/utils',
      '@styles': '/src/styles'
    }
  }
})

