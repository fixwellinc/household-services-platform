#!/usr/bin/env node

/**
 * Migration script to switch from the old unified server to the enhanced version
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🔄 Migrating to Enhanced Unified Server...');

try {
  // Backup the original unified server
  const originalServer = path.join(rootDir, 'unified-server.js');
  const backupServer = path.join(rootDir, 'unified-server-backup.js');
  
  if (fs.existsSync(originalServer)) {
    fs.copyFileSync(originalServer, backupServer);
    console.log('✅ Original unified server backed up to unified-server-backup.js');
  }
  
  // Copy the enhanced server to replace the original
  const enhancedServer = path.join(rootDir, 'unified-server-enhanced.js');
  
  if (fs.existsSync(enhancedServer)) {
    fs.copyFileSync(enhancedServer, originalServer);
    console.log('✅ Enhanced unified server installed as unified-server.js');
  } else {
    console.error('❌ Enhanced unified server not found at unified-server-enhanced.js');
    process.exit(1);
  }
  
  // Update package.json scripts if needed
  const packageJsonPath = path.join(rootDir, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Update start script to use the enhanced server
    if (packageJson.scripts && packageJson.scripts.start) {
      const oldStart = packageJson.scripts.start;
      
      if (oldStart.includes('unified-server.js')) {
        console.log('✅ Package.json start script already configured for unified-server.js');
      } else {
        packageJson.scripts.start = 'node unified-server.js';
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('✅ Updated package.json start script');
      }
    }
  }
  
  console.log('\n🎉 Migration completed successfully!');
  console.log('\n📋 What changed:');
  console.log('  • Service isolation architecture implemented');
  console.log('  • Graceful error handling for service failures');
  console.log('  • Enhanced maintenance pages for frontend failures');
  console.log('  • Improved error logging and service monitoring');
  console.log('  • Automatic service recovery for non-critical services');
  
  console.log('\n🚀 To start the enhanced server:');
  console.log('  npm start');
  
  console.log('\n🔍 To monitor service health:');
  console.log('  curl http://localhost:3000/api/health');
  
  console.log('\n📝 Notes:');
  console.log('  • Your original server is backed up as unified-server-backup.js');
  console.log('  • The enhanced server provides better error handling and monitoring');
  console.log('  • Non-critical services (Redis, Socket.IO) can fail without stopping the server');
  console.log('  • Frontend failures will show a maintenance page while keeping the API functional');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}