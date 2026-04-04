export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const USER = process.env.BASIC_AUTH_USER?.trim();
  const PASS = process.env.BASIC_AUTH_PASS?.trim();

  const auth = req.headers.get('authorization');

  if (auth?.startsWith('Basic ')) {
    const encoded = auth.split(' ')[1];
    const decoded = atob(encoded);
    const [user, ...rest] = decoded.split(':');
    const pass = rest.join(':'); // por si la clave tiene ':'

    if (user === USER && pass === PASS) {
      // Sirve el index.html de la SPA
      const spaUrl = new URL('/index.html', req.url);
      return fetch(spaUrl.toString());
    }
  }

  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Área Protegida"',
      'Content-Type': 'text/plain',
    },
  });
}