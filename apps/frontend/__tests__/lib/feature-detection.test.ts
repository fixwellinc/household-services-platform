import { featureDetector, supportsCSS, supportsJS, supportsInput, userPreferences } from '@/lib/feature-detection';

// Mock window and document
const mockWindow = {
  CSS: {
    supports: jest.fn(),
  },
  matchMedia: jest.fn(),
  IntersectionObserver: jest.fn(),
  ResizeObserver: jest.fn(),
};

const mockDocument = {
  createElement: jest.fn(() => ({
    style: {},
  })),
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  hardwareConcurrency: 4,
  maxTouchPoints: 0,
};

// Setup global mocks
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

describe('FeatureDetector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    featureDetector.clearCache();
  });

  describe('CSS Feature Detection', () => {
    it('detects CSS Grid support', () => {
      const mockElement = { style: { display: '' } };
      mockDocument.createElement.mockReturnValue(mockElement);
      
      // Test supported
      mockElement.style.display = 'grid';
      expect(featureDetector.detectCSSGrid()).toBe(true);
      
      // Test not supported
      mockElement.style.display = '';
      featureDetector.clearCache();
      expect(featureDetector.detectCSSGrid()).toBe(false);
    });

    it('detects CSS Flexbox support', () => {
      const mockElement = { style: { display: '' } };
      mockDocument.createElement.mockReturnValue(mockElement);
      
      // Test supported
      mockElement.style.display = 'flex';
      expect(featureDetector.detectCSSFlexbox()).toBe(true);
      
      // Test not supported
      mockElement.style.display = '';
      featureDetector.clearCache();
      expect(featureDetector.detectCSSFlexbox()).toBe(false);
    });

    it('detects CSS Custom Properties support', () => {
      mockWindow.CSS.supports.mockReturnValue(true);
      expect(featureDetector.detectCSSCustomProperties()).toBe(true);
      
      mockWindow.CSS.supports.mockReturnValue(false);
      featureDetector.clearCache();
      expect(featureDetector.detectCSSCustomProperties()).toBe(false);
    });

    it('detects CSS backdrop-filter support', () => {
      mockWindow.CSS.supports
        .mockReturnValueOnce(true) // backdrop-filter
        .mockReturnValueOnce(false); // -webkit-backdrop-filter
      
      expect(featureDetector.detectCSSBackdropFilter()).toBe(true);
      
      mockWindow.CSS.supports
        .mockReturnValueOnce(false) // backdrop-filter
        .mockReturnValueOnce(true); // -webkit-backdrop-filter
      
      featureDetector.clearCache();
      expect(featureDetector.detectCSSBackdropFilter()).toBe(true);
      
      mockWindow.CSS.supports.mockReturnValue(false);
      featureDetector.clearCache();
      expect(featureDetector.detectCSSBackdropFilter()).toBe(false);
    });

    it('detects 3D transforms support', () => {
      const mockElement = { style: { transform: '' } };
      mockDocument.createElement.mockReturnValue(mockElement);
      
      // Test supported
      mockElement.style.transform = 'translateZ(0)';
      expect(featureDetector.detectCSS3DTransforms()).toBe(true);
      
      // Test not supported
      mockElement.style.transform = '';
      featureDetector.clearCache();
      expect(featureDetector.detectCSS3DTransforms()).toBe(false);
    });
  });

  describe('JavaScript Feature Detection', () => {
    it('detects Intersection Observer support', () => {
      expect(featureDetector.detectIntersectionObserver()).toBe(true);
      
      delete (mockWindow as any).IntersectionObserver;
      featureDetector.clearCache();
      expect(featureDetector.detectIntersectionObserver()).toBe(false);
    });

    it('detects Resize Observer support', () => {
      expect(featureDetector.detectResizeObserver()).toBe(true);
      
      delete (mockWindow as any).ResizeObserver;
      featureDetector.clearCache();
      expect(featureDetector.detectResizeObserver()).toBe(false);
    });

    it('detects WebGL support', () => {
      const mockCanvas = {
        getContext: jest.fn().mockReturnValue({}),
      };
      mockDocument.createElement.mockReturnValue(mockCanvas);
      
      expect(featureDetector.detectWebGL()).toBe(true);
      
      mockCanvas.getContext.mockReturnValue(null);
      featureDetector.clearCache();
      expect(featureDetector.detectWebGL()).toBe(false);
    });
  });

  describe('Input Detection', () => {
    it('detects touch events support', () => {
      (mockWindow as any).ontouchstart = {};
      expect(featureDetector.detectTouchEvents()).toBe(true);
      
      delete (mockWindow as any).ontouchstart;
      mockNavigator.maxTouchPoints = 0;
      featureDetector.clearCache();
      expect(featureDetector.detectTouchEvents()).toBe(false);
    });

    it('detects pointer events support', () => {
      (mockWindow as any).onpointerdown = {};
      expect(featureDetector.detectPointerEvents()).toBe(true);
      
      delete (mockWindow as any).onpointerdown;
      featureDetector.clearCache();
      expect(featureDetector.detectPointerEvents()).toBe(false);
    });
  });

  describe('User Preferences', () => {
    it('detects reduced motion preference', () => {
      const mockMediaQuery = {
        matches: true,
      };
      mockWindow.matchMedia.mockReturnValue(mockMediaQuery);
      
      expect(featureDetector.detectReducedMotion()).toBe(true);
      
      mockMediaQuery.matches = false;
      featureDetector.clearCache();
      expect(featureDetector.detectReducedMotion()).toBe(false);
    });

    it('detects high contrast preference', () => {
      const mockMediaQuery = {
        matches: true,
      };
      mockWindow.matchMedia.mockReturnValue(mockMediaQuery);
      
      expect(featureDetector.detectHighContrast()).toBe(true);
      
      mockMediaQuery.matches = false;
      featureDetector.clearCache();
      expect(featureDetector.detectHighContrast()).toBe(false);
    });

    it('detects screen reader usage', () => {
      (mockWindow as any).speechSynthesis = {};
      expect(featureDetector.detectScreenReader()).toBe(true);
      
      delete (mockWindow as any).speechSynthesis;
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 NVDA';
      featureDetector.clearCache();
      expect(featureDetector.detectScreenReader()).toBe(true);
      
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      featureDetector.clearCache();
      expect(featureDetector.detectScreenReader()).toBe(false);
    });
  });

  describe('Convenience Functions', () => {
    it('provides CSS support shortcuts', () => {
      const mockElement = { style: { display: 'grid' } };
      mockDocument.createElement.mockReturnValue(mockElement);
      
      expect(supportsCSS.grid()).toBe(true);
      expect(typeof supportsCSS.flexbox).toBe('function');
      expect(typeof supportsCSS.customProperties).toBe('function');
    });

    it('provides JS support shortcuts', () => {
      expect(supportsJS.intersectionObserver()).toBe(true);
      expect(typeof supportsJS.resizeObserver).toBe('function');
      expect(typeof supportsJS.webGL).toBe('function');
    });

    it('provides input support shortcuts', () => {
      expect(typeof supportsInput.touch).toBe('function');
      expect(typeof supportsInput.pointer).toBe('function');
      expect(typeof supportsInput.deviceMotion).toBe('function');
    });

    it('provides user preference shortcuts', () => {
      const mockMediaQuery = { matches: false };
      mockWindow.matchMedia.mockReturnValue(mockMediaQuery);
      
      expect(userPreferences.reducedMotion()).toBe(false);
      expect(typeof userPreferences.highContrast).toBe('function');
      expect(typeof userPreferences.screenReader).toBe('function');
    });
  });

  describe('getAllFeatures', () => {
    it('returns all feature support information', () => {
      const features = featureDetector.getAllFeatures();
      
      expect(features).toHaveProperty('cssGrid');
      expect(features).toHaveProperty('cssFlexbox');
      expect(features).toHaveProperty('intersectionObserver');
      expect(features).toHaveProperty('touchEvents');
      expect(features).toHaveProperty('reducedMotion');
      expect(typeof features.cssGrid).toBe('boolean');
    });
  });

  describe('Cache Management', () => {
    it('caches detection results', () => {
      const mockElement = { style: { display: 'grid' } };
      mockDocument.createElement.mockReturnValue(mockElement);
      
      // First call
      expect(featureDetector.detectCSSGrid()).toBe(true);
      expect(mockDocument.createElement).toHaveBeenCalledTimes(1);
      
      // Second call should use cache
      expect(featureDetector.detectCSSGrid()).toBe(true);
      expect(mockDocument.createElement).toHaveBeenCalledTimes(1);
    });

    it('clears cache when requested', () => {
      const mockElement = { style: { display: 'grid' } };
      mockDocument.createElement.mockReturnValue(mockElement);
      
      featureDetector.detectCSSGrid();
      expect(mockDocument.createElement).toHaveBeenCalledTimes(1);
      
      featureDetector.clearCache();
      featureDetector.detectCSSGrid();
      expect(mockDocument.createElement).toHaveBeenCalledTimes(2);
    });
  });
});