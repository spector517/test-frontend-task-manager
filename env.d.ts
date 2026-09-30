/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Доля (0..1) случайных ошибок мок-API — для демонстрации error-state */
  readonly VITE_MOCK_FAIL_RATE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
