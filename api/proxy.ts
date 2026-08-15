export const config = {
  runtime: 'edge', // Runs on Vercel Global Edge Network with zero cold start
};

export default async function handler(req: Request) {
  // Handle CORS preflight options
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const url = new URL(req.url);
  const targetParam = url.searchParams.get('target');

  if (!targetParam) {
    return new Response(
      JSON.stringify({ error: 'Missing required "target" query parameter.' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  // URLSearchParams has already decoded the query value once.
  const targetUrl = targetParam;

  try {
    const forwardHeaders = new Headers();
    req.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Exclude hop-by-hop and browser host headers
      if (!['host', 'origin', 'referer', 'content-length', 'connection'].includes(lowerKey)) {
        forwardHeaders.set(key, value);
      }
    });

    const isBodyAllowed = ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase());
    const body = isBodyAllowed ? req.body : undefined;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
      redirect: 'follow',
    });

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(lowerKey)) {
        responseHeaders.set(key, value);
      }
    });

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({
        error: 'Proxy Forwarding Error',
        details: errorMsg,
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
