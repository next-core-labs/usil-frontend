import { Capacitor } from '@capacitor/core';

/**
 * On the web the SPA is served by the same origin as the API, so every call
 * site can use a root-relative `/api/...` or `/uploads/...` path. The native
 * shell loads the bundled dist/ from capacitor://localhost (iOS) or
 * https://localhost (Android), where those paths resolve to the app bundle and
 * 404. Rather than thread a base URL through ~75 call sites, we rewrite the
 * two API-owned prefixes at the boundary: fetch, XHR, and image elements.
 */
export const API_ORIGIN = 'https://usil.app';

const REMOTE_PREFIXES = ['/api/', '/uploads/'];

function needsRewrite(url: string): boolean {
  return REMOTE_PREFIXES.some((prefix) => url.startsWith(prefix));
}

/** Root-relative API paths become absolute; everything else is left alone. */
export function toRemoteUrl(url: string): string {
  return needsRewrite(url) ? `${API_ORIGIN}${url}` : url;
}

function rewriteRequestInfo(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof input === 'string') return toRemoteUrl(input);
  if (input instanceof URL) return input;
  if (input instanceof Request && needsRewrite(new URL(input.url, location.href).pathname)) {
    // A Request's url is already absolute against capacitor://localhost, so
    // rebuild it against the API origin while keeping method, body and headers.
    const { pathname, search } = new URL(input.url);
    return new Request(`${API_ORIGIN}${pathname}${search}`, input);
  }
  return input;
}

function patchFetch() {
  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
    original(rewriteRequestInfo(input), init);
}

function patchXhr() {
  const original = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function patched(
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ) {
    const next = typeof url === 'string' ? toRemoteUrl(url) : url;
    return (original as (...args: unknown[]) => void).call(this, method, next, ...rest);
  } as typeof XMLHttpRequest.prototype.open;
}

/**
 * Images bypass fetch entirely. React writes img sources through both the
 * `src` property and setAttribute depending on the render path, so patch both
 * and funnel them into the same rewrite.
 */
function patchImages() {
  const proto = HTMLImageElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'src');
  if (descriptor?.set && descriptor.get) {
    const { set, get } = descriptor;
    Object.defineProperty(proto, 'src', {
      ...descriptor,
      get(this: HTMLImageElement) {
        return get.call(this);
      },
      set(this: HTMLImageElement, value: string) {
        set.call(this, toRemoteUrl(String(value)));
      },
    });
  }

  const originalSetAttribute = proto.setAttribute;
  proto.setAttribute = function patched(this: HTMLImageElement, name: string, value: string) {
    const next = name === 'src' ? toRemoteUrl(String(value)) : value;
    return originalSetAttribute.call(this, name, next);
  };
}

let installed = false;

/**
 * Must run before the first request or render. Safe to call on web, where it
 * is a no-op.
 */
export function installNativeApiOrigin() {
  if (installed || !Capacitor.isNativePlatform()) return;
  installed = true;
  patchFetch();
  patchXhr();
  patchImages();
}
