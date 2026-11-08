/// <reference types="vite/client" />

// Tipagem da única variável de build do front (contrato FATIA-01-FRONT §4.1) — por nome, sem valor.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
