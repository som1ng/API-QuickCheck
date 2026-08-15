import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Transparent local proxy with SSL bypass for local development
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
          chunks.push(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk);
        }
        
        let totalLen = 0;
        for (const c of chunks) totalLen += c.length;
        const bodyBuffer = new Uint8Array(totalLen);
        let offset = 0;
        for (const c of chunks) {
          bodyBuffer.set(c, offset);
          offset += c.length;
        }

        const httpModule = await import(targetUrl.startsWith('https:') ? 'https' : 'http');
        const { URL } = await import('url');
        const targetObj = new URL(targetUrl);

        const forwardHeaders: Record<string, string | string[]> = {};
        for (const [k, v] of Object.entries(req.headers)) {
          const lk = k.toLowerCase();
          if (!['host', 'origin', 'referer', 'content-length', 'connection'].includes(lk) && v !== undefined) {
            forwardHeaders[k] = v as any;
          }
        }
        forwardHeaders['host'] = targetObj.host;
        if (!forwardHeaders['user-agent']) {
          forwardHeaders['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
        }
        if (bodyBuffer.length > 0) {
          forwardHeaders['content-length'] = String(bodyBuffer.length);
        }

        const proxyReq = httpModule.request(
          targetUrl,
          {
            method: req.method || 'GET',
            headers: forwardHeaders,
            rejectUnauthorized: false,
            timeout: 10000,
          },
          (proxyRes: any) => {
            res.statusCode = proxyRes.statusCode || 200;
            res.statusMessage = proxyRes.statusMessage || '';

            for (const [k, v] of Object.entries(proxyRes.headers)) {
              if (v && !['content-encoding', 'transfer-encoding', 'connection'].includes(k.toLowerCase())) {
                res.setHeader(k, v);
              }
            }
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', '*');

            proxyRes.pipe(res);
          }
        );

        proxyReq.on('error', (err: any) => {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ error: 'Proxy Gateway Error', details: err?.message || 'Error' }));
        });

        proxyReq.on('timeout', () => {
          proxyReq.destroy();
          res.statusCode = 504;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ error: 'Proxy Gateway Timeout (10000ms)' }));
        });

        if (bodyBuffer.length > 0) {
          proxyReq.write(bodyBuffer);
        }
        proxyReq.end();
      } catch (err: unknown) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Proxy Error' }));
      }
    });
  },
});

export default defineConfig({
  plugins: [react(), localCorsProxyPlugin()],
})
