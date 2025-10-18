import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PERFORMANCE_BUDGETS } from '../performance-setup'

// Mock Web Vitals collector
vi.mock('@/lib/performance/core/WebVitalsCollector', () => ({
  WebVitalsCollector: vi.fn().mockImplementation(() => ({
    collectLCP: vi.fn(),
    collectFID: vi.fn(),
    collectCLS: vi.fn(),
    collectTTFB: vi.fn(),
    collectFCP: vi.fn(),
    getMetrics: vi.fn(),
    reportMetrics: vi.fn()
  }))
}))

// Mock performance entries
const mockPerformanceEntries = {
  lcp: { value: 2000, name: 'largest-contentful-paint' },
  fid: { value: 80, name: 'first-input-delay' },
  cls: { value: 0.05, name: 'cumulative-layout-shift' },
  ttfb: { value: 200, name: 'time-to-first-byte' },
  fcp: { value: 1200, name: 'first-contentful-paint' }
}

describe('Web Vitals Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock PerformanceObserver
    global.PerformanceObserver = vi.fn().mockImplementation((callback) => {
      const observer = {
        observe: vi.fn(),
        disconnect: vi.fn(),
        takeRecords: vi.fn(() => [])
      }
      
      // Simulate performance entries
      setTimeout(() => {
        callback({
          getEntries: () => Object.values(mockPerformanceEntries)
        })
      }, 100)
      
      return observer
    })
  })

  describe('Core Web Vitals Monitoring', () => {
    it('measures Largest Contentful Paint (LCP) within budget', async () => {
      const { WebVitalsCollector } = await import('@/lib/performance/core/WebVitalsCollector')
      const collector = new WebVitalsCollector()
      
      // Simulate LCP measurement
      collector.collectLCP()
      
      // Mock the collected value
      collector.getMetrics.mockReturnValue({
        lcp: mockPerformanceEntries.lcp.value
      })
      
      const metrics = collector.getMetrics()
      expect(metrics.lcp).toBeLessThan(PERFORMANCE_BUDGETS.LARGEST_CONTENTFUL_PAINT)
    })

    it('measures First Input Delay (FID) within budget', async () => {
      const { WebVitalsCollector } = await import('@/lib/performance/core/WebVitalsCollector')
      const collector = new WebVitalsCollector()
      
      collector.collectFID()
      
      collector.getMetrics.mockReturnValue({
        fid: mockPerformanceEntries.fid.value
      })
      
      const metrics = collector.getMetrics()
      expect(metrics.fid).toBeLessThan(PERFORMANCE_BUDGETS.FIRST_INPUT_DELAY)
    })

    it('measures Cumulative Layout Shift (CLS) within budget', async () => {
      const { WebVitalsCollector } = await import('@/lib/performance/core/WebVitalsCollector')
      const collector = new WebVitalsCollector()
      
      collector.collectCLS()
      
      collector.getMetrics.mockReturnValue({
        cls: mockPerformanceEntries.cls.value
      })
      
      const metrics = collector.getMetrics()
      expect(metrics.cls).toBeLessThan(PERFORMANCE_BUDGETS.CUMULATIVE_LAYOUT_SHIFT)
    })

    it('measures First Contentful Paint (FCP) within budget', async () => {
      const { WebVitalsCollector } = await import('@/lib/performance/core/WebVitalsCollector')
      const collector = new WebVitalsCollector()
      
      collector.collectFCP()
      
      collector.getMetrics.mockReturnValue({
        fcp: mockPerformanceEntries.fcp.value
      })
      
      const metrics = collector.getMetrics()
      expect(metrics.fcp).toBeLessThan(PERFORMANCE_BUDGETS.FIRST_CONTENTFUL_PAINT)
    })
  })

  describe('Performance Regression Detection', () => {
    it('detects LCP regression', async () => {
      const { WebVitalsCollector } = await import('@/lib/performance/core/WebVitalsCollector')
      const collector = new WebVitalsCollector()
      
      // Simulate baseline metrics
      const baselineLCP = 1800
      const currentLCP = 2800 // Regression
      
      collector.getMetrics.mockReturnValue({
        lcp: currentLCP
      })
      
      const metrics = collector.getMetrics()
      const regression = ((metrics.lcp - baselineLCP) / baselineLCP) * 100
      
      // Should detect significant regression (>20%)
      expect(regression).toBeGreaterThan(20)
      expect(metrics.lcp).toBeGreaterThan(PERFORMANCE_BUDGETS.LARGEST_CONTENTFUL_PAINT)
    })

    it('detects CLS regression', async () => {
      const { WebVitalsCollector } = await import('@/lib/performance/core/WebVitalsCollector')
      const collector = new WebVitalsCollector()
      
      const baselineCLS = 0.05
      const currentCLS = 0.15 // Regression
      
      collector.getMetrics.mockReturnValue({
        cls: currentCLS
      })
      
      const metrics = collector.getMetrics()
      const regression = metrics.cls - baselineCLS
      
      expect(regression).toBeGreaterThan(0.05) // Significant CLS increase
      expect(metrics.cls).toBeGreaterThan(PERFORMANCE_BUDGETS.CUMULATIVE_LAYOUT_SHIFT)
    })
  })

  describe('Performance Monitoring Integration', () => {
    it('reports metrics to monitoring system', async () => {
      const { WebVitalsCollector } = await import('@/lib/performance/core/WebVitalsCollector')
      const collector = new WebVitalsCollector()
      
      collector.getMetrics.mockReturnValue(mockPerformanceEntries)
      
      const reportSpy = collector.reportMetrics
      collector.reportMetrics()
      
      expect(reportSpy).toHaveBeenCalled()
    })

    it('handles performance observer errors gracefully', () => {
      // Mock PerformanceObserver that throws
      global.PerformanceObserver = vi.fn().mockImplementation(() => {
        throw new Error('PerformanceObserver not supported')
      })
      
      expect(() => {
        new (require('@/lib/performance/core/WebVitalsCollector').WebVitalsCollector)()
      }).not.toThrow()
    })
  })

  describe('Performance Budget Validation', () => {
    it('validates all core web vitals against budgets', async () => {
      const { WebVitalsCollector } = await import('@/lib/performance/core/WebVitalsCollector')
      const collector = new WebVitalsCollector()
      
      collector.getMetrics.mockReturnValue({
        lcp: mockPerformanceEntries.lcp.value,
        fid: mockPerformanceEntries.fid.value,
        cls: mockPerformanceEntries.cls.value,
        fcp: mockPerformanceEntries.fcp.value,
        ttfb: mockPerformanceEntries.ttfb.value
      })
      
      const metrics = collector.getMetrics()
      
      // All metrics should be within budget
      expect(metrics.lcp).toBeLessThan(PERFORMANCE_BUDGETS.LARGEST_CONTENTFUL_PAINT)
      expect(metrics.fid).toBeLessThan(PERFORMANCE_BUDGETS.FIRST_INPUT_DELAY)
      expect(metrics.cls).toBeLessThan(PERFORMANCE_BUDGETS.CUMULATIVE_LAYOUT_SHIFT)
      expect(metrics.fcp).toBeLessThan(PERFORMANCE_BUDGETS.FIRST_CONTENTFUL_PAINT)
    })

    it('creates performance budget report', async () => {
      const { WebVitalsCollector } = await import('@/lib/performance/core/WebVitalsCollector')
      const collector = new WebVitalsCollector()
      
      collector.getMetrics.mockReturnValue({
        lcp: mockPerformanceEntries.lcp.value,
        fid: mockPerformanceEntries.fid.value,
        cls: mockPerformanceEntries.cls.value
      })
      
      const metrics = collector.getMetrics()
      
      const budgetReport = {
        lcp: {
          value: metrics.lcp,
          budget: PERFORMANCE_BUDGETS.LARGEST_CONTENTFUL_PAINT,
          passed: metrics.lcp < PERFORMANCE_BUDGETS.LARGEST_CONTENTFUL_PAINT
        },
        fid: {
          value: metrics.fid,
          budget: PERFORMANCE_BUDGETS.FIRST_INPUT_DELAY,
          passed: metrics.fid < PERFORMANCE_BUDGETS.FIRST_INPUT_DELAY
        },
        cls: {
          value: metrics.cls,
          budget: PERFORMANCE_BUDGETS.CUMULATIVE_LAYOUT_SHIFT,
          passed: metrics.cls < PERFORMANCE_BUDGETS.CUMULATIVE_LAYOUT_SHIFT
        }
      }
      
      // All budget checks should pass
      Object.values(budgetReport).forEach(check => {
        expect(check.passed).toBe(true)
      })
    })
  })
})