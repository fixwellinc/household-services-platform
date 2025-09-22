// Polyfills for Next.js 15 server-side rendering issues

// Fix for "self is not defined" error
if (typeof self === 'undefined') {
  global.self = global;
}

// Fix for "window is not defined" error
if (typeof window === 'undefined') {
  global.window = {};
}

// Fix for "document is not defined" error
if (typeof document === 'undefined') {
  global.document = {};
}

// Fix for "navigator is not defined" error
if (typeof navigator === 'undefined') {
  global.navigator = {};
}

// Fix for "location is not defined" error
if (typeof location === 'undefined') {
  global.location = {};
}

// Export for use in other files
module.exports = {};