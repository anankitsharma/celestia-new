import { Linking } from 'react-native';

const APP_SCHEME = 'celestia://';

/**
 * Deep link route handlers.
 * Registered once in App.js via initDeepLinks().
 */
let handlers = {};

/**
 * Parse a deep link URL into { route, params }.
 * Supports: celestia://invite/CODE, celestia://referral/CODE, celestia://chart, etc.
 */
export function parseDeepLink(url) {
  if (!url) return null;
  try {
    // Strip scheme
    let path = url;
    if (path.startsWith(APP_SCHEME)) {
      path = path.slice(APP_SCHEME.length);
    } else if (path.includes('?invite=')) {
      // Web fallback URL: https://...?invite=CODE
      const code = path.split('invite=')[1]?.split('&')[0];
      return code ? { route: 'invite', params: { code } } : null;
    } else if (path.includes('?ref=')) {
      const code = path.split('ref=')[1]?.split('&')[0];
      return code ? { route: 'referral', params: { code } } : null;
    }

    // Parse path segments: route/param1/param2
    const segments = path.split('/').filter(Boolean);
    const route = segments[0] || null;
    const params = {};
    if (segments[1]) params.code = segments[1];

    return route ? { route, params } : null;
  } catch {
    return null;
  }
}

/**
 * Register a handler for a specific route.
 * handler receives (params) => void
 */
export function registerDeepLinkHandler(route, handler) {
  handlers[route] = handler;
}

/**
 * Process a deep link URL — finds matching handler and calls it.
 */
export function handleDeepLink(url) {
  const parsed = parseDeepLink(url);
  if (!parsed) return false;

  const handler = handlers[parsed.route];
  if (handler) {
    handler(parsed.params);
    return true;
  }
  return false;
}

/**
 * Initialize deep link listeners.
 * Call once in App.js after navigation is ready.
 */
export function initDeepLinks() {
  // Handle link that opened the app (cold start)
  Linking.getInitialURL().then(url => {
    if (url) handleDeepLink(url);
  });

  // Handle links while app is running (warm start)
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url);
  });

  return () => subscription?.remove();
}

/**
 * Generate a shareable deep link URL.
 */
export function buildDeepLink(route, code) {
  return `${APP_SCHEME}${route}/${code}`;
}
