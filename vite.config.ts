import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'element-plus', test: /node_modules[\\/](element-plus|@element-plus)/ },
            { name: 'vendor', test: /node_modules/ },
          ],
        },
      },
    },
    // Element Plus подключён целиком (прототип) — его чанк заведомо больше 500 kB
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    css: false,
    server: {
      deps: {
        inline: ['element-plus'],
      },
    },
  },
})
