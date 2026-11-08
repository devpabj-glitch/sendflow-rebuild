import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const previewPort = Number(process.env.PORT) || 4173

export default defineConfig({
  plugins: [react()],
  preview: {
    host: true,
    port: previewPort,
    allowedHosts: true,
  },
})
