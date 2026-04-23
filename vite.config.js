import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/asset-sanitation/',
  server: {
    proxy: {
      '/api': {
        target: 'http://erp_custom_apps_api:8000',
        changeOrigin: true,
      },
    },
  },
})