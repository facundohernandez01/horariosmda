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
    const pass = rest.join(':');

    if (user === USER && pass === PASS) {
      // Leer el index.html del build estático directamente
      const base = new URL(req.url);
      base.pathname = '/index.html';

      const res = await fetch(base, {
        // Header especial para que Vercel no re-rutee internamente
        headers: { 'x-middleware-subrequest': '1' },
      });

      return new Response(res.body, {
        status: 200,
        headers: {
          'content-type': 'text/html',
        },
      });
    }
  }

  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Área Protegida"',
    },
  });
}