import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Public (browser) VITE_* values committed in `public.env` — the hosting build has no .env file.
// Real environment variables still win.
try {
  for (const line of readFileSync(new URL('./public.env', import.meta.url), 'utf8').split('\n')) {
    const m = /^\s*(VITE_[A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* no public.env */
}

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: '0.0.0.0', allowedHosts: true },
  preview: { port: 5173, host: '0.0.0.0', allowedHosts: true },
});
