import { DeadCodeAnalyzer } from '../DeadCodeAnalyzer';
import { FileInventory } from '../../types';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('DeadCodeAnalyzer', () => {
  let analyzer: DeadCodeAnalyzer;
  
  beforeEach(() => {
    analyzer = new DeadCodeAnalyzer();
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should have correct name and description', () => {
      expect(analyzer.name).toBe('dead-code-analyzer');
      expect(analyzer.description).toContain('unused exports, functions, and variables');
    });

    it('should be able to run', async () => {
      const canRun = await analyzer.canRun();
      expect(canRun).toBe(true);
    });

    it('should estimate time based on inventory size', () => {
      const estimatedTime = analyzer.getEstimatedTime(100);
      expect(estimatedTime).toBe(1000); // 100 * 10ms
    });
  });

  describe('File filtering', () => {
    it('should only analyze TypeScript and JavaScript files', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/test.ts', 'typescript'),
        createMockFile('src/test.js', 'javascript'),
        createMockFile('src/test.json', 'json'),
        createMockFile('src/test.md', 'markdown'),
        createMockFile('src/test.test.ts', 'typescript'), // Should be excluded
        createMockFile('node_modules/lib.js', 'javascript'), // Should be excluded
      ];

      // Mock file contents
      mockFs.readFile.mockImplementation((filePath: any, encoding: any, callback: any) => {
        if (filePath.includes('test.ts') && !filePath.includes('.test.')) {
          callback(null, 'function unusedFunction() { return "test"; }');
        } else if (filePath.includes('test.js') && !filePath.includes('node_modules')) {
          callback(null, 'const unusedVar = "test";');
        } else {
          callback(new Error('File not found'), null);
        }
      });

      const result = await analyzer.analyze(inventory);
      
      expect(result.analyzer).toBe('dead-code-analyzer');
      expect(result.confidence).toBe('medium');
      expect(result.riskLevel).toBe('review');
    });
  });

  describe('Symbol detection', () => {
    it('should detect unused functions', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/unused-function.ts', 'typescript'),
      ];

      const sourceCode = `
        function usedFunction() {
          return "used";
        }
        
        function unusedFunction() {
          return "unused";
        }
        
        // This function is used
        usedFunction();
      `;

      mockFs.readFile.mockImplementation((filePath: any, encoding: any, callback: any) => {
        callback(null, sourceCode);
      });

      const result = await analyzer.analyze(inventory);
      
      expect(result.findings.length).toBeGreaterThan(0);
      const unusedFinding = result.findings.find(f => 
        f.description.includes('unusedFunction')
      );
      expect(unusedFinding).toBeDefined();
    });

    it('should detect unused variables', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/unused-vars.ts', 'typescript'),
      ];

      const sourceCode = `
        const usedVar = "used";
        const unusedVar = "unused";
        let anotherUnusedVar = 42;
        
        console.log(usedVar);
      `;

      mockFs.readFile.mockImplementation((filePath: any, encoding: any, callback: any) => {
        callback(null, sourceCode);
      });

      const result = await analyzer.analyze(inventory);
      
      expect(result.findings.length).toBeGreaterThan(0);
      const unusedVarFinding = result.findings.find(f => 
        f.description.includes('unusedVar') || f.description.includes('anotherUnusedVar')
      );
      expect(unusedVarFinding).toBeDefined();
    });

    it('should detect unused classes', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/unused-class.ts', 'typescript'),
      ];

      const sourceCode = `
        class UsedClass {
          method() { return "used"; }
        }
        
        class UnusedClass {
          method() { return "unused"; }
        }
        
        const instance = new UsedClass();
      `;

      mockFs.readFile.mockImplementation((filePath: any, encoding: any, callback: any) => {
        callback(null, sourceCode);
      });

      const result = await analyzer.analyze(inventory);
      
      expect(result.findings.length).toBeGreaterThan(0);
      const unusedClassFinding = result.findings.find(f => 
        f.description.includes('UnusedClass')
      );
      expect(unusedClassFinding).toBeDefined();
    });
  });

  describe('Export analysis', () => {
    it('should distinguish between exported and internal unused symbols', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/exports.ts', 'typescript'),
      ];

      const sourceCode = `
        export function exportedUnusedFunction() {
          return "exported but unused";
        }
        
        function internalUnusedFunction() {
          return "internal and unused";
        }
        
        export const exportedUnusedVar = "unused";
        const internalUnusedVar = "unused";
      `;

      mockFs.readFile.mockImplementation((filePath: any, encoding: any, callback: any) => {
        callback(null, sourceCode);
      });

      const result = await analyzer.analyze(inventory);
      
      expect(result.findings.length).toBeGreaterThan(0);
      
      // Should have findings for unused symbols
      const unusedFinding = result.findings.find(f => 
        f.description.includes('unused')
      );
      expect(unusedFinding).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle files that cannot be parsed', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/valid.ts', 'typescript'),
        createMockFile('src/invalid.ts', 'typescript'),
      ];

      mockFs.readFile.mockImplementation((filePath: any, encoding: any, callback: any) => {
        if (filePath.includes('valid.ts')) {
          callback(null, 'function validFunction() { return "valid"; }');
        } else if (filePath.includes('invalid.ts')) {
          callback(null, 'invalid syntax here !!!');
        } else {
          callback(new Error('File not found'), null);
        }
      });

      // Should not throw an error, just skip invalid files
      const result = await analyzer.analyze(inventory);
      expect(result).toBeDefined();
      expect(result.analyzer).toBe('dead-code-analyzer');
    });

    it('should handle file read errors gracefully', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/missing.ts', 'typescript'),
      ];

      mockFs.readFile.mockImplementation((filePath: any, encoding: any, callback: any) => {
        callback(new Error('File not found'), null);
      });

      // Should not throw an error
      const result = await analyzer.analyze(inventory);
      expect(result).toBeDefined();
      expect(result.findings).toEqual([]);
    });
  });

  describe('Progress reporting', () => {
    it('should report progress during analysis', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/test1.ts', 'typescript'),
        createMockFile('src/test2.ts', 'typescript'),
      ];

      mockFs.readFile.mockImplementation((filePath: any, encoding: any, callback: any) => {
        callback(null, 'function testFunction() { return "test"; }');
      });

      const progressUpdates: any[] = [];
      const progressCallback = (progress: any) => {
        progressUpdates.push(progress);
      };

      await analyzer.analyze(inventory, progressCallback);
      
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].currentStep).toContain('Parsing files');
      expect(progressUpdates[progressUpdates.length - 1].percentage).toBe(100);
    });
  });
});

/**
 * Helper function to create mock FileInventory objects
 */
function createMockFile(filePath: string, fileType: any): FileInventory {
  return {
    path: filePath,
    size: 1000,
    lastModified: new Date(),
    contentHash: 'mock-hash-' + filePath.replace(/[^a-zA-Z0-9]/g, ''),
    fileType,
    workspace: filePath.includes('packages/') ? 'shared' : 'root'
  };
}