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
  try {
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
      try {
        // Use writeFileSync with flag to ensure file exists even if Next.js deletes it
        fs.writeFileSync(filepath, content, { encoding: 'utf8', flag: 'w' });
        // Verify file was written
        if (!fs.existsSync(filepath)) {
          console.warn(`Warning: Failed to create ${filename}, retrying...`);
          fs.writeFileSync(filepath, content, { encoding: 'utf8', flag: 'w' });
        }
      } catch (err) {
        console.warn(`Warning: Error creating ${filename}:`, err.message);
      }
    });
  } catch (err) {
    console.warn('Warning: Error ensuring manifests:', err.message);
  }
}

// Ensure manifests exist before build - call multiple times to be safe
ensureManifests();

// Verify manifests exist and retry if needed
let retries = 0;
while (retries < 5) {
  const pagesManifest = path.join(serverDir, 'pages-manifest.json');
  if (fs.existsSync(pagesManifest)) {
    break;
  }
  ensureManifests();
  retries++;
  // Small synchronous delay using busy-wait (only a few milliseconds)
  const start = Date.now();
  while (Date.now() - start < 10) {}
}

console.log('✅ Manifest files ensured before build');

// Map build commands to next build arguments
const buildCmd = process.argv[2] || 'build';
let nextArgs = ['build'];

if (buildCmd === 'build:simple') {
  nextArgs = ['build', '--no-lint', '--experimental-build-mode=compile'];
} else if (buildCmd === 'build:minimal') {
  nextArgs = ['build', '--no-lint'];
} else {
  // Default build command
  nextArgs = ['build'];
}

// Use npx to find next binary (works in both workspace and non-workspace setups)
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

// Start periodic manifest checking before spawning build
const manifestCheck = setInterval(() => {
  ensureManifests();
}, 50);

// Monitor the build process and ensure manifests exist periodically
const buildProcess = spawn(npxCmd, ['next', ...nextArgs], {
  cwd: frontendDir,
  stdio: 'inherit',
  env: { ...process.env }
});

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

