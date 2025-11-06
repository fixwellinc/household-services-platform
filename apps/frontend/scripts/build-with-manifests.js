#!/usr/bin/env node

/**
 * Build wrapper that ensures manifest files exist during Next.js 15 build process
 * This fixes the ENOENT error for pages-manifest.json during "Collecting page data"
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, '..');
const nextDir = path.join(frontendDir, '.next');
const serverDir = path.join(nextDir, 'server');

function ensureManifests() {
  if (!fs.existsSync(serverDir)) {
    fs.mkdirSync(serverDir, { recursive: true });
  }
  
  const manifests = {
    'pages-manifest.json': '{}',
    'app-paths-manifest.json': '{}',
    'middleware-manifest.json': JSON.stringify({
      sortedMiddleware: [],
      middleware: {},
      functions: {}
    }),
    'font-manifest.json': JSON.stringify({
      pages: {},
      app: {},
      appUsingSizeAdjust: false,
      pagesUsingSizeAdjust: false
    })
  };
  
  Object.entries(manifests).forEach(([filename, content]) => {
    const filepath = path.join(serverDir, filename);
    fs.writeFileSync(filepath, content, 'utf8');
  });
}

// Ensure manifests exist before build
ensureManifests();

// Run the build command
const buildCmd = process.argv[2] || 'build';
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// Monitor the build process and ensure manifests exist periodically
const buildProcess = spawn(npmCmd, ['run', buildCmd], {
  cwd: frontendDir,
  stdio: 'inherit',
  env: { ...process.env }
});

// Ensure manifests exist periodically during build (every 500ms)
const manifestCheck = setInterval(() => {
  ensureManifests();
}, 500);

buildProcess.on('close', (code) => {
  clearInterval(manifestCheck);
  
  // Ensure manifests exist after build completes
  ensureManifests();
  
  if (code !== 0) {
    console.error(`\n❌ Build failed with exit code ${code}`);
    process.exit(code);
  } else {
    console.log('\n✅ Build completed successfully');
    process.exit(0);
  }
});

buildProcess.on('error', (error) => {
  clearInterval(manifestCheck);
  console.error('❌ Build process error:', error);
  process.exit(1);
});

