import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 3000;

// Import backend app
import('./apps/backend/src/app.js').then(({ app: backendApp }) => {
  // Import the Next.js standalone server
  import('./apps/frontend/.next/standalone/server.js').then(({ default: nextServer }) => {
    const server = createServer(async (req, res) => {
      try {
        // Check if the request is for the API
        if (req.url.startsWith('/api')) {
          // Handle API requests with backend
          backendApp(req, res);
        } else {
          // Handle all other requests with Next.js standalone server
          nextServer(req, res);
        }
      } catch (err) {
        console.error('Error occurred handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);
      console.log(`> API available at http://localhost:${port}/api`);
    });
  }).catch((error) => {
    console.error('Failed to load Next.js standalone server:', error);
    process.exit(1);
  });
}).catch((error) => {
  console.error('Failed to load backend:', error);
  process.exit(1);
}); 