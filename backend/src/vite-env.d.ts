/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALPHAVANTAGE_API_KEY: string
  readonly VITE_AV_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
