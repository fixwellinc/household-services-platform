import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import next from 'next';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0'; // Railway needs 0.0.0.0
const port = parseInt(process.env.PORT || '3000', 10);

// Check if Next.js build exists in production mode
const frontendDir = path.join(__dirname, 'apps/frontend');
const nextBuildDir = path.join(frontendDir, '.next');
const buildManifestFile = path.join(nextBuildDir, 'build-manifest.json');
const serverDir = path.join(nextBuildDir, 'server');

// Check for build completion - Next.js 15 with custom generateBuildId may not create BUILD_ID
// So we check for build-manifest.json and server directory instead
const hasProductionBuild = isProduction && (
  fs.existsSync(buildManifestFile) && 
  fs.existsSync(serverDir)
);

// Fix middleware manifest before Next.js tries to read it
// This prevents "Cannot read properties of undefined (reading '/_middleware')" error
if (hasProductionBuild) {
  const middlewareManifestFile = path.join(serverDir, 'middleware-manifest.json');
  try {
    let middlewareManifest = {};
    if (fs.existsSync(middlewareManifestFile)) {
      try {
        middlewareManifest = JSON.parse(fs.readFileSync(middlewareManifestFile, 'utf8'));
      } catch (err) {
        console.warn('⚠️  Could not parse middleware-manifest.json, creating new one');
      }
    }
    
    // Ensure middleware object exists and has proper structure
    if (!middlewareManifest.middleware || typeof middlewareManifest.middleware !== 'object') {
      middlewareManifest.middleware = {};
    }
    
    // Ensure the root '/' middleware entry exists (Next.js looks for this)
    if (!middlewareManifest.middleware['/']) {
      middlewareManifest.middleware['/'] = {
        env: [],
        files: ['server/middleware.js'],
        name: 'middleware',
        page: '/',
        matchers: [
          {
            regexp: '^(?:/((?!api|_next/static|_next/image|favicon.ico).*))?$',
            originalSource: '/:path*'
          }
        ],
        wasm: [],
        assets: []
      };
    }
    
    // Ensure sortedMiddleware exists
    if (!Array.isArray(middlewareManifest.sortedMiddleware)) {
      middlewareManifest.sortedMiddleware = [];
    }
    
    // Ensure functions exists
    if (!middlewareManifest.functions || typeof middlewareManifest.functions !== 'object') {
      middlewareManifest.functions = {};
    }
    
    // Write the fixed manifest
    fs.writeFileSync(middlewareManifestFile, JSON.stringify(middlewareManifest, null, 2), 'utf8');
    console.log('✅ Fixed middleware-manifest.json structure');
  } catch (err) {
    console.warn('⚠️  Warning: Could not fix middleware-manifest.json:', err.message);
  }
}

const dev = !hasProductionBuild; // Use dev mode if no production build found

console.log('🚀 Starting unified server...');
console.log('📦 Environment:', process.env.NODE_ENV || 'development');
console.log('🔧 Next.js mode:', dev ? 'development' : 'production');
console.log('📁 Frontend directory:', frontendDir);
console.log('📁 Build directory:', nextBuildDir);
console.log('✅ Build manifest exists:', fs.existsSync(buildManifestFile));
console.log('✅ Server directory exists:', fs.existsSync(serverDir));
console.log('🌐 Hostname:', hostname);
console.log('🔌 Port:', port);

// Create Next.js app with correct directory
const nextApp = next({ 
  dev, 
  hostname, 
  port,
  dir: frontendDir,
  customServer: true
});
const handle = nextApp.getRequestHandler();

// Import backend app
import('./apps/backend/src/app.js').then(({ app: backendApp }) => {
  // Start the unified server
  nextApp.prepare().then(() => {
    console.log('✅ Next.js application prepared successfully');
    console.log('📁 Next.js build directory:', nextBuildDir);
    console.log('🔧 Next.js dev mode:', dev);
    const server = createServer(async (req, res) => {
      try {
        // Check if the request is for the API
        if (req.url && req.url.startsWith('/api')) {
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
    // CORS configuration is handled by backend app's CORS middleware
    const io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      }
    });
    // Make io available to backend routes that use req.app.get('io')
    backendApp.set('io', io);

    server.listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`> ✅ Ready on http://${hostname}:${port}`);
      console.log(`> 🔌 API available at http://${hostname}:${port}/api`);
      console.log(`> 🏥 Health check available at http://${hostname}:${port}/api/health`);
    });
  }).catch((nextError) => {
    console.error('❌ Failed to prepare Next.js application:', nextError);
    console.log('⚠️  Starting backend-only server...');
    console.log('📝 Frontend will show "Service Temporarily Unavailable"');

    // Fallback: Start backend-only server if Next.js fails
    const fallbackServer = createServer((req, res) => {
      if (req.url && req.url.startsWith('/api')) {
        backendApp(req, res);
      } else {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'text/html');
        res.end('<h1>Service Temporarily Unavailable</h1><p>Frontend is loading...</p>');
      }
    });

    fallbackServer.listen(port, hostname, () => {
      console.log(`> ✅ Backend-only server ready on http://${hostname}:${port}`);
      console.log(`> 🔌 API available at http://${hostname}:${port}/api`);
    });
  });
}).catch((error) => {
  console.error('❌ Failed to load backend:', error);
  process.exit(1);
}); 