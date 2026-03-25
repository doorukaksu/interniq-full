/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  // Add further VITE_ variables here as you introduce them
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}