/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the REST API. Empty means same origin (the Vite dev server proxies /api and /avatars). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
