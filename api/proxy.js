export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const headers = new Headers();
    if (req.headers.authorization) headers.set('Authorization', req.headers.authorization);
    if (req.headers['x-api-key']) headers.set('x-api-key', req.headers['x-api-key']);
    if (req.headers['x-goog-api-key']) headers.set('x-goog-api-key', req.headers['x-goog-api-key']);
    if (req.headers['anthropic-version']) headers.set('anthropic-version', req.headers['anthropic-version']);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
    });
    
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
