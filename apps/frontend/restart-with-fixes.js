#!/usr/bin/env node

/**
 * Restart Development Server with React Error Fixes
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Preparing to restart development server with fixes...');

// 1. Clear Next.js cache
const nextCacheDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextCacheDir)) {
  console.log('🧹 Clearing Next.js cache...');
  fs.rmSync(nextCacheDir, { recursive: true, force: true });
}

// 2. Clear node_modules/.cache if it exists
const nodeCacheDir = path.join(process.cwd(), 'node_modules', '.cache');
if (fs.existsSync(nodeCacheDir)) {
  console.log('🧹 Clearing node_modules cache...');
  fs.rmSync(nodeCacheDir, { recursive: true, force: true });
}

console.log('✅ Cache cleared successfully');

// 3. Show summary of fixes applied
console.log('\n📋 Summary of React Error Fixes Applied:');
console.log('');
console.log('🔧 Error Boundaries:');
console.log('  • Created ErrorBoundary component for catching React errors');
console.log('  • Added global error handler for application-level errors');
console.log('  • Updated root layout with error boundary wrapper');
console.log('');
console.log('🔧 Hydration Fixes:');
console.log('  • Created HydrationSafe component for client-side only content');
console.log('  • Added useHasMounted hook for safe client-side rendering');
console.log('  • Created ClientOnly wrapper for preventing SSR mismatches');
console.log('');
console.log('🔧 Text Rendering Fixes:');
console.log('  • Created SafeText component to prevent React error #418');
console.log('  • Added safe text conversion utilities');
console.log('  • Created conditional rendering helpers');
console.log('');
console.log('🔧 Page Fixes:');
console.log('  • Fixed /blog page with proper error handling');
console.log('  • Fixed /terms page with proper error handling');
console.log('  • Added loading states and error boundaries');
console.log('');
console.log('🔧 Development Improvements:');
console.log('  • Added dev:safe script for safer development');
console.log('  • Created development-friendly Next.js config');
console.log('  • Added comprehensive error handling guide');
console.log('');

// 4. Instructions for the user
console.log('🚀 Next Steps:');
console.log('');
console.log('1. Start the development server:');
console.log('   npm run dev:safe');
console.log('');
console.log('2. Test the previously failing pages:');
console.log('   • http://localhost:3000/blog');
console.log('   • http://localhost:3000/terms');
console.log('');
console.log('3. Check browser console for any remaining errors');
console.log('');
console.log('4. If you see React errors, use the new components:');
console.log('   • <SafeText>{dynamicContent}</SafeText>');
console.log('   • <HydrationSafe><ClientComponent /></HydrationSafe>');
console.log('   • <ErrorBoundary><YourComponent /></ErrorBoundary>');
console.log('');
console.log('5. For production deployment:');
console.log('   npm run build && npm run start:safe');
console.log('');

console.log('📚 Documentation:');
console.log('  • Check ERROR_HANDLING_GUIDE.md for detailed usage');
console.log('  • All new components are in components/common/');
console.log('  • Utilities are in lib/utils/');
console.log('');

console.log('✨ The React errors #418 and #306 should now be resolved!');
console.log('✨ Server 500 errors on /blog and /terms should be fixed!');
console.log('');
console.log('🎯 Ready to start development server with: npm run dev:safe');