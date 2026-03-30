export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);

  // ✅ 1. dejar pasar TODAS las APIs
  if (url.pathname.startsWith('/api')) {
    return fetch(req);
  }

  // 🔐 2. auth
  const auth = req.headers.get('authorization');

  const USER = process.env.BASIC_AUTH_USER?.trim();
  const PASS = process.env.BASIC_AUTH_PASS?.trim();

  if (auth) {
    const encoded = auth.split(' ')[1];
    const decoded = atob(encoded);
    const [user, pass] = decoded.split(':');

    // DEBUG (sacalo después)
    console.log("ENV USER:", USER);
    console.log("INPUT USER:", user);

    if (user === USER && pass === PASS) {
      url.pathname = '/index.html';
      return fetch(url);
    }
  }

  return new Response('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Protected Area"',
    },
  });
}