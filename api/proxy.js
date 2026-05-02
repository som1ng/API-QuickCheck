export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { targetUrl, headers = {} } = req.body ?? {};

  if (typeof targetUrl !== 'string' || !targetUrl) {
    return res.status(400).json({ error: 'Missing targetUrl' });
  }

  if (typeof headers !== 'object' || headers === null || Array.isArray(headers)) {
    return res.status(400).json({ error: 'Invalid headers payload' });
  }

  let parsedTargetUrl;
  try {
    parsedTargetUrl = new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid targetUrl' });
  }

  if (!['http:', 'https:'].includes(parsedTargetUrl.protocol)) {
    return res.status(400).json({ error: 'Only http and https URLs are supported' });
  }

  try {
    const upstreamHeaders = new Headers();
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'string') {
        upstreamHeaders.set(key, value);
      }
    }

    const response = await fetch(parsedTargetUrl.toString(), {
      method: 'GET',
      headers: upstreamHeaders,
    });

    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    const rawBody = await response.text();
    return res.status(response.status).send(rawBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy request failed';
    return res.status(500).json({ error: message });
  }
}
