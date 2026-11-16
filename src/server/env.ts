/**
 * Runtime-agnostic environment access.
 *
 * Works on Node.js (any serverless host or own server: `process.env`), on Cloudflare Workers / Pages
 * (bindings copied to `globalThis` or passed to `setServerEnv`), Deno (`Deno.env`) and Bun.
 * Never import this module from browser code.
 */

type EnvRecord = Record<string, string | undefined>;

let overrides: EnvRecord = {};

/**
 * Inject environment bindings explicitly — e.g. from a Cloudflare `fetch(request, env)` handler:
 * `setServerEnv(env)` before calling a handler.
 */
export function setServerEnv(values: Record<string, unknown>): void {
  const next: EnvRecord = {};
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'string') next[key] = value;
  }
  overrides = { ...overrides, ...next };
}

function fromProcess(name: string): string | undefined {
  const proc = (globalThis as { process?: { env?: EnvRecord } }).process;
  return proc?.env?.[name];
}

function fromDeno(name: string): string | undefined {
  const deno = (globalThis as { Deno?: { env?: { get?: (key: string) => string | undefined } } }).Deno;
  try {
    return deno?.env?.get?.(name);
  } catch {
    return undefined;
  }
}

function fromGlobal(name: string): string | undefined {
  const value = (globalThis as Record<string, unknown>)[name];
  return typeof value === 'string' ? value : undefined;
}

/** Returns a trimmed value or `undefined` when the variable is missing/empty. */
export function getEnv(name: string): string | undefined {
  const raw = overrides[name] ?? fromProcess(name) ?? fromDeno(name) ?? fromGlobal(name);
  if (raw === undefined) return undefined;
  const value = raw.trim();
  return value === '' ? undefined : value;
}

/** Same as `getEnv`, but throws a `MissingEnvError` when the variable is not configured. */
export function requireEnv(name: string): string {
  const value = getEnv(name);
  if (value === undefined) throw new MissingEnvError(name);
  return value;
}

export class MissingEnvError extends Error {
  readonly variable: string;

  constructor(variable: string) {
    super(`Server is not configured: environment variable ${variable} is missing.`);
    this.name = 'MissingEnvError';
    this.variable = variable;
  }
}
