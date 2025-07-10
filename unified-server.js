import express from 'express';
import { createServer } from 'http';
import next from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Create Next.js app with correct directory
const nextApp = next({ 
  dev, 
  hostname, 
  port,
  dir: path.join(__dirname, 'apps/frontend')
});
const handle = nextApp.getRequestHandler();

// Import backend app
import('./apps/backend/src/app.js').then(({ default: backendApp }) => {
  // Start the unified server
  nextApp.prepare().then(() => {
    const server = createServer(async (req, res) => {
      try {
        // Check if the request is for the API
        if (req.url.startsWith('/api')) {
          // Handle API requests with backend
          backendApp(req, res);
        } else {
          // Handle all other requests with Next.js
          await handle(req, res);
        }
      } catch (err) {
        console.error('Error occurred handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> API available at http://${hostname}:${port}/api`);
    });
  });
}).catch((error) => {
  console.error('Failed to load backend:', error);
  process.exit(1);
}); 