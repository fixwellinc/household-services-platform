/**
 * Dashboard Routing Test Polyfills
 * 
 * Polyfills for browser APIs needed in dashboard routing tests
 */

// URL polyfill for older Node.js versions
if (typeof global.URL === 'undefined') {
  global.URL = require('url').URL;
}

// URLSearchParams polyfill
if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = require('url').URLSearchParams;
}

// TextEncoder/TextDecoder for crypto operations
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Crypto polyfill for UUID generation in tests
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  };
}

// AbortController for fetch cancellation tests
if (typeof global.AbortController === 'undefined') {
  global.AbortController = class AbortController {
    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
    }
    
    abort() {
      this.signal.aborted = true;
    }
  };
}

// Fetch polyfill (will be mocked in tests)
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn();
}

// Request/Response for fetch tests
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(url, options = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this.headers = new Map(Object.entries(options.headers || {}));
      this.body = options.body;
    }
  };
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, options = {}) {
      this.body = body;
      this.status = options.status || 200;
      this.statusText = options.statusText || 'OK';
      this.headers = new Map(Object.entries(options.headers || {}));
      this.ok = this.status >= 200 && this.status < 300;
    }
    
    async json() {
      return JSON.parse(this.body);
    }
    
    async text() {
      return this.body;
    }
  };
}

// Headers for fetch tests
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers extends Map {
    constructor(init) {
      super();
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.set(key, value));
        } else if (typeof init === 'object') {
          Object.entries(init).forEach(([key, value]) => this.set(key, value));
        }
      }
    }
    
    append(name, value) {
      const existing = this.get(name);
      this.set(name, existing ? `${existing}, ${value}` : value);
    }
  };
}

// FormData for file upload tests
if (typeof global.FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {
      this.data = new Map();
    }
    
    append(name, value, filename) {
      if (!this.data.has(name)) {
        this.data.set(name, []);
      }
      this.data.get(name).push({ value, filename });
    }
    
    get(name) {
      const values = this.data.get(name);
      return values ? values[0].value : null;
    }
    
    getAll(name) {
      const values = this.data.get(name);
      return values ? values.map(v => v.value) : [];
    }
    
    has(name) {
      return this.data.has(name);
    }
    
    set(name, value, filename) {
      this.data.set(name, [{ value, filename }]);
    }
    
    delete(name) {
      this.data.delete(name);
    }
    
    entries() {
      const entries = [];
      for (const [name, values] of this.data) {
        for (const { value } of values) {
          entries.push([name, value]);
        }
      }
      return entries[Symbol.iterator]();
    }
  };
}

// File for file upload tests
if (typeof global.File === 'undefined') {
  global.File = class File {
    constructor(bits, name, options = {}) {
      this.bits = bits;
      this.name = name;
      this.type = options.type || '';
      this.lastModified = options.lastModified || Date.now();
      this.size = bits.reduce((size, bit) => size + (bit.length || bit.byteLength || 0), 0);
    }
  };
}

// Blob for file tests
if (typeof global.Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(parts = [], options = {}) {
      this.parts = parts;
      this.type = options.type || '';
      this.size = parts.reduce((size, part) => size + (part.length || part.byteLength || 0), 0);
    }
    
    slice(start = 0, end = this.size, contentType = '') {
      return new Blob(this.parts.slice(start, end), { type: contentType });
    }
    
    async text() {
      return this.parts.join('');
    }
    
    async arrayBuffer() {
      const text = await this.text();
      const buffer = new ArrayBuffer(text.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < text.length; i++) {
        view[i] = text.charCodeAt(i);
      }
      return buffer;
    }
  };
}

// CustomEvent for event simulation
if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type, options);
      this.detail = options.detail;
    }
  };
}

// MutationObserver for DOM change tests
if (typeof global.MutationObserver === 'undefined') {
  global.MutationObserver = class MutationObserver {
    constructor(callback) {
      this.callback = callback;
    }
    
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}

// getComputedStyle for style tests
if (typeof global.getComputedStyle === 'undefined') {
  global.getComputedStyle = () => ({
    getPropertyValue: () => '',
  });
}

console.log('✅ Dashboard routing test polyfills loaded');