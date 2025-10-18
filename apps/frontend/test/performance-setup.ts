import { vi } from 'vitest'

// Performance testing utilities
Object.defineProperty(global, 'performance', {
  value: global.performance || {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  timing: {
    navigationStart: Date.now() - 1000,
    loadEventEnd: Date.now(),
    domContentLoadedEventEnd: Date.now() - 500
  }
  },
  writable: true,
  configurable: true
})

// Mock Web Vitals API
global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => [])
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Performance budget thresholds
export const PERFORMANCE_BUDGETS = {
  COMPONENT_RENDER_TIME: 16, // 16ms for 60fps
  BUNDLE_SIZE_KB: 150, // 150KB gzipped
  FIRST_CONTENTFUL_PAINT: 1500, // 1.5s
  LARGEST_CONTENTFUL_PAINT: 2500, // 2.5s
  CUMULATIVE_LAYOUT_SHIFT: 0.1, // 0.1 CLS score
  FIRST_INPUT_DELAY: 100, // 100ms
  TIME_TO_INTERACTIVE: 3000 // 3s
}

// Helper to measure component render time
export function measureRenderTime(renderFn: () => void): number {
  const start = performance.now()
  renderFn()
  const end = performance.now()
  return end - start
}

// Helper to simulate slow network conditions
export function simulateSlowNetwork() {
  // Mock slow network responses
  vi.stubGlobal('fetch', vi.fn().mockImplementation(() => 
    new Promise(resolve => 
      setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({})
      }), 2000)
    )
  ))
}

// Helper to simulate memory pressure
export function simulateMemoryPressure() {
  // Mock memory API
  Object.defineProperty(performance, 'memory', {
    value: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
      jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 // 2GB
    }
  })
}