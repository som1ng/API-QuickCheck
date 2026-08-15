import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local CORS-free transparent proxy middleware for development
const localCorsProxyPlugin = () => ({
  name: 'local-cors-proxy',
  configureServer(server: any) {
    server.middlewares.use('/api/proxy', async (req: any, res: any) => {
      try {
        const rawUrl: string = req.url || '';
        const queryIndex = rawUrl.indexOf('?target=');
        const targetUrl = queryIndex !== -1 ? decodeURIComponent(rawUrl.slice(queryIndex + 8)) : '';

        if (!targetUrl) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing target URL parameter' }));
          return;
        }

        const chunks: Uint8Array[] = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        
        let totalLen = 0;
        for (const c of chunks) totalLen += c.length;
        const bodyBuffer = new Uint8Array(totalLen);
        let offset = 0;
        for (const c of chunks) {
          bodyBuffer.set(c, offset);
          offset += c.length;
        }

        const forwardHeaders: Record<string, string> = {};
        for (const [k, v] of Object.entries(req.headers)) {
          if (!['host', 'origin', 'referer', 'content-length'].includes(k.toLowerCase()) && typeof v === 'string') {
            forwardHeaders[k] = v;
          }
        }

        const fetchFn = (globalThis as any).fetch;
        const response = await fetchFn(targetUrl, {
          method: req.method || 'GET',
          headers: forwardHeaders,
          body: req.method && ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase()) && totalLen > 0 ? bodyBuffer : undefined,
        });

        res.statusCode = response.status;
        response.headers.forEach((value: string, key: string) => {
          if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
            res.setHeader(key, value);
          }
        });
        res.setHeader('Access-Control-Allow-Origin', '*');

        const resBuffer = await response.arrayBuffer();
        res.end(new Uint8Array(resBuffer));
      } catch (err: unknown) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Proxy Error' }));
      }
    });
  },
});

export default defineConfig({
  plugins: [react(), localCorsProxyPlugin()],
})
