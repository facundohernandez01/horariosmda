export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);

  // dejar pública esta ruta
  if (url.pathname.startsWith('/api-turnos')) {
    return fetch(req);
  }

  const auth = req.headers.get('authorization');

  const USER = process.env.BASIC_AUTH_USER;
  const PASS = process.env.BASIC_AUTH_PASS;

  if (auth) {
    const encoded = auth.split(' ')[1];
    const decoded = atob(encoded);
    const [user, pass] = decoded.split(':');

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