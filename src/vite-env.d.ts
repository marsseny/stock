/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PUBLIC_MEDIA_R2_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PROMO_SECOND_ITEM?: string;
  readonly VITE_PROMO_THIRD_ITEM?: string;
  readonly VITE_PROMO_FREE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
