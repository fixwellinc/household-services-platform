import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
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
import('./apps/backend/src/app.js').then(({ app: backendApp }) => {
  // Start the unified server
  nextApp.prepare().then(() => {
    console.log('Next.js application prepared successfully');
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

    // Attach Socket.IO to the unified HTTP server and inject into backend app
    const io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      }
    });
    // Make io available to backend routes that use req.app.get('io')
    backendApp.set('io', io);

    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> API available at http://${hostname}:${port}/api`);
    });
  }).catch((nextError) => {
    console.error('Failed to prepare Next.js application:', nextError);
    console.log('Starting backend-only server...');

    // Fallback: Start backend-only server if Next.js fails
    const fallbackServer = createServer((req, res) => {
      if (req.url.startsWith('/api')) {
        backendApp(req, res);
      } else {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'text/html');
        res.end('<h1>Service Temporarily Unavailable</h1><p>Frontend is loading...</p>');
      }
    });

    fallbackServer.listen(port, () => {
      console.log(`> Backend-only server ready on http://${hostname}:${port}`);
    });
  });
}).catch((error) => {
  console.error('Failed to load backend:', error);
  process.exit(1);
}); 