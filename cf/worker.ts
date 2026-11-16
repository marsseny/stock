/** Cloudflare Pages advanced-mode entry (_worker.js): /api/* → handlers, everything else → static assets. */
import { routes, setServerEnv } from '../src/server/index';

interface Env { ASSETS: { fetch: (r: Request) => Promise<Response> }; [k: string]: unknown }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      setServerEnv(env);
      const handler = routes[url.pathname.slice(5).replace(/\/+$/, '')];
      if (!handler) return Response.json({ error: 'not_found', message: 'Unknown API route.' }, { status: 404 });
      return handler(request);
    }
    const res = await env.ASSETS.fetch(request);
    if (res.status === 404 && request.method === 'GET' && !url.pathname.includes('.')) {
      return env.ASSETS.fetch(new Request(new URL('/', url), request));
    }
    return res;
  },
};
