import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const previewPort = Number(process.env.PORT) || 4173
// Proxy de dev (contrato FATIA-01-FRONT §4.2): /api → API local do A1 (porta confirmada
// pelo coordenador). API_PROXY_TARGET é lida só aqui no Node — não vai para o bundle.
const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:8787'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: previewPort,
    allowedHosts: true,
  },
})
