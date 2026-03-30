export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const auth = req.headers.get('authorization');

  const USER = process.env.BASIC_AUTH_USER;
  const PASS = process.env.BASIC_AUTH_PASS;

  if (auth) {
    const encoded = auth.split(' ')[1];
    const decoded = atob(encoded);
    const [user, pass] = decoded.split(':');

    if (user === USER && pass === PASS) {
      // 👇 IMPORTANTE: ir directo al index.html
      const url = new URL(req.url);
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