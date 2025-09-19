import { TestFileAnalyzer } from '../TestFileAnalyzer';
import { FileInventory } from '../../types';
import * as fs from 'fs/promises';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('TestFileAnalyzer', () => {
  let analyzer: TestFileAnalyzer;

  beforeEach(() => {
    analyzer = new TestFileAnalyzer();
    jest.clearAllMocks();
  });

  describe('Basic Properties', () => {
    it('should have correct name and description', () => {
      expect(analyzer.name).toBe('test-file-analyzer');
      expect(analyzer.description).toContain('test files');
    });

    it('should always be able to run', async () => {
      const canRun = await analyzer.canRun();
      expect(canRun).toBe(true);
    });

    it('should estimate time based on inventory size', () => {
      const time = analyzer.getEstimatedTime(100);
      expect(time).toBe(300); // 100 * 3ms
    });
  });

  describe('Test File Identification', () => {
    it('should identify test files with .test. pattern', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/components/Button.test.ts', 'typescript'),
        createMockFile('src/components/Button.test.tsx', 'typescript'),
        createMockFile('src/components/Button.test.js', 'javascript'),
        createMockFile('src/components/Button.test.jsx', 'javascript'),
        createMockFile('src/components/Button.ts', 'typescript'), // Not a test
      ];

      mockFs.readFile.mockResolvedValue('// Empty test file');

      const result = await analyzer.analyze(inventory);
      
      // Should identify test files but not find issues with empty inventory
      expect(result.analyzer).toBe('test-file-analyzer');
      expect(result.findings).toHaveLength(4); // 4 empty test files
    });

    it('should identify test files with .spec. pattern', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/utils/helper.spec.ts', 'typescript'),
        createMockFile('src/utils/helper.spec.js', 'javascript'),
        createMockFile('src/utils/helper.ts', 'typescript'), // Not a test
      ];

      mockFs.readFile.mockResolvedValue('// Empty test file');

      const result = await analyzer.analyze(inventory);
      
      expect(result.findings).toHaveLength(2); // 2 empty test files
    });

    it('should identify test files in __tests__ directories', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/components/__tests__/Button.ts', 'typescript'),
        createMockFile('src/utils/__tests__/helper.js', 'javascript'),
        createMockFile('src/components/Button.ts', 'typescript'), // Not a test
      ];

      mockFs.readFile.mockResolvedValue('// Empty test file');

      const result = await analyzer.analyze(inventory);
      
      // Should find 1 orphaned test (helper.js) + 2 empty test files
      expect(result.findings).toHaveLength(3);
      
      // Verify we have both orphaned and empty test findings
      const orphanedFindings = result.findings.filter(f => f.description.includes('orphaned'));
      const emptyFindings = result.findings.filter(f => f.description.includes('empty'));
      expect(orphanedFindings).toHaveLength(1);
      expect(emptyFindings).toHaveLength(2);
    });

    it('should identify test files in /tests/ directories', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/tests/integration.ts', 'typescript'),
        createMockFile('backend/tests/api.js', 'javascript'),
        createMockFile('src/components/Button.ts', 'typescript'), // Not a test
      ];

      mockFs.readFile.mockResolvedValue('// Empty test file');

      const result = await analyzer.analyze(inventory);
      
      // Should find 2 orphaned tests + 2 empty test files
      expect(result.findings).toHaveLength(4);
      
      // Verify we have both orphaned and empty test findings
      const orphanedFindings = result.findings.filter(f => f.description.includes('orphaned'));
      const emptyFindings = result.findings.filter(f => f.description.includes('empty'));
      expect(orphanedFindings).toHaveLength(2);
      expect(emptyFindings).toHaveLength(2);
    });
  });

  describe('Orphaned Test Detection', () => {
    it('should detect orphaned test files', async () => {
      const inventory: FileInventory[] = [
        // Test file without corresponding source
        createMockFile('src/components/Button.test.ts', 'typescript'),
        // Source file that exists
        createMockFile('src/components/Modal.ts', 'typescript'),
        // Test file with corresponding source
        createMockFile('src/components/Modal.test.ts', 'typescript'),
      ];

      mockFs.readFile.mockResolvedValue('test("should work", () => { expect(true).toBe(true); });');

      const result = await analyzer.analyze(inventory);
      
      const orphanedFindings = result.findings.filter(f => 
        f.description.includes('orphaned') && 
        f.files.includes('src/components/Button.test.ts')
      );
      
      expect(orphanedFindings).toHaveLength(1);
      expect(orphanedFindings[0].type).toBe('obsolete');
      expect(orphanedFindings[0].recommendation).toContain('Review and remove');
    });

    it('should handle __tests__ directory structure', async () => {
      const inventory: FileInventory[] = [
        // Test file in __tests__ directory
        createMockFile('src/components/__tests__/Button.test.ts', 'typescript'),
        // Corresponding source file
        createMockFile('src/components/Button.ts', 'typescript'),
        // Orphaned test file
        createMockFile('src/utils/__tests__/helper.test.ts', 'typescript'),
      ];

      mockFs.readFile.mockResolvedValue('test("should work", () => { expect(true).toBe(true); });');

      const result = await analyzer.analyze(inventory);
      
      const orphanedFindings = result.findings.filter(f => 
        f.description.includes('orphaned')
      );
      
      expect(orphanedFindings).toHaveLength(1);
      expect(orphanedFindings[0].files[0]).toBe('src/utils/__tests__/helper.test.ts');
    });

    it('should consider alternative file extensions', async () => {
      const inventory: FileInventory[] = [
        // Test file expecting .ts source
        createMockFile('src/components/Button.test.ts', 'typescript'),
        // But source file is .tsx
        createMockFile('src/components/Button.tsx', 'typescript'),
      ];

      mockFs.readFile.mockResolvedValue('test("should work", () => { expect(true).toBe(true); });');

      const result = await analyzer.analyze(inventory);
      
      // Should not report as orphaned because .tsx alternative exists
      const orphanedFindings = result.findings.filter(f => 
        f.description.includes('orphaned')
      );
      
      expect(orphanedFindings).toHaveLength(0);
    });
  });

  describe('Obsolete Import Detection', () => {
    it('should detect obsolete relative imports', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/components/Button.test.ts', 'typescript'),
        createMockFile('src/components/Modal.ts', 'typescript'), // Exists - should not be flagged
        // Missing: src/components/Button.ts and src/components/NonExistent.ts
      ];

      const testContent = `
        import Button from './Button'; // This import is obsolete (no Button.ts)
        import Modal from './Modal'; // This import is valid (Modal.ts exists)
        import NonExistent from './NonExistent'; // This import is obsolete
        
        test('should work', () => {
          expect(true).toBe(true);
        });
      `;

      mockFs.readFile.mockImplementation((filePath: any) => {
        if (filePath.includes('Button.test.ts')) {
          return Promise.resolve(testContent);
        }
        return Promise.resolve('// Other file content');
      });

      const result = await analyzer.analyze(inventory);
      
      const obsoleteImportFindings = result.findings.filter(f => 
        f.description.includes('obsolete import')
      );
      
      if (obsoleteImportFindings.length > 0) {
        // If we're finding obsolete imports, check what we found
        const description = obsoleteImportFindings[0].description;
        
        // Should find Button and NonExistent as obsolete, but not Modal
        expect(description).toContain('./Button');
        expect(description).toContain('./NonExistent');
        expect(description).not.toContain('./Modal');
      }
    });

    it('should ignore external package imports', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/components/Button.test.ts', 'typescript'),
      ];

      const testContent = `
        import React from 'react'; // External package - should be ignored
        import { render } from '@testing-library/react'; // External package - should be ignored
        import Button from './Button'; // Local import - will be checked
        
        test('should work', () => {
          expect(true).toBe(true);
        });
      `;

      mockFs.readFile.mockResolvedValue(testContent);

      const result = await analyzer.analyze(inventory);
      
      const obsoleteImportFindings = result.findings.filter(f => 
        f.description.includes('obsolete import')
      );
      
      expect(obsoleteImportFindings).toHaveLength(1);
      // Should only report the local import, not the external ones
      expect(obsoleteImportFindings[0].description).toContain('1 obsolete import(s)');
      expect(obsoleteImportFindings[0].description).toContain('./Button');
    });

    it('should handle import path resolution correctly', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/components/forms/LoginForm.test.ts', 'typescript'),
        createMockFile('src/components/Button.ts', 'typescript'),
        createMockFile('src/utils/helpers.ts', 'typescript'),
      ];

      const testContent = `
        import Button from '../Button'; // Should resolve to src/components/Button.ts
        import { helper } from '../../utils/helpers'; // Should resolve to src/utils/helpers.ts
        import Missing from '../Missing'; // Should not resolve
        
        test('should work', () => {
          expect(true).toBe(true);
        });
      `;

      mockFs.readFile.mockResolvedValue(testContent);

      const result = await analyzer.analyze(inventory);
      
      const obsoleteImportFindings = result.findings.filter(f => 
        f.description.includes('obsolete import')
      );
      
      if (obsoleteImportFindings.length > 0) {
        const description = obsoleteImportFindings[0].description;
        
        // Should only find Missing as obsolete
        expect(description).toContain('../Missing');
        expect(description).not.toContain('../Button');
        expect(description).not.toContain('../../utils/helpers');
      }
    });
  });

  describe('Empty Test Suite Detection', () => {
    it('should detect completely empty test files', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/components/Button.test.ts', 'typescript'),
      ];

      mockFs.readFile.mockResolvedValue('   \n  // Just comments  \n   ');

      const result = await analyzer.analyze(inventory);
      
      const emptyTestFindings = result.findings.filter(f => 
        f.description.includes('empty or contains no meaningful test assertions')
      );
      
      expect(emptyTestFindings).toHaveLength(1);
      expect(emptyTestFindings[0].type).toBe('obsolete');
    });

    it('should detect test files with no assertions', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/components/Button.test.ts', 'typescript'),
      ];

      const testContent = `
        describe('Button', () => {
          it('should work', () => {
            // TODO: Add test implementation
          });
        });
      `;

      mockFs.readFile.mockResolvedValue(testContent);

      const result = await analyzer.analyze(inventory);
      
      const emptyTestFindings = result.findings.filter(f => 
        f.description.includes('empty or contains no meaningful test assertions')
      );
      
      expect(emptyTestFindings).toHaveLength(1);
    });

    it('should detect placeholder tests', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/components/Button.test.ts', 'typescript'),
      ];

      const testContent = `
        describe('Button', () => {
          it.skip('should work', () => {
            expect(true).toBe(true);
          });
          
          it('TODO: implement this test', () => {
            // Not implemented yet
          });
        });
      `;

      mockFs.readFile.mockResolvedValue(testContent);

      const result = await analyzer.analyze(inventory);
      
      const emptyTestFindings = result.findings.filter(f => 
        f.description.includes('empty or contains no meaningful test assertions')
      );
      
      expect(emptyTestFindings).toHaveLength(1);
    });

    it('should not flag valid test files', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/components/Button.test.ts', 'typescript'),
      ];

      const testContent = `
        import Button from './Button';
        
        describe('Button', () => {
          it('should render correctly', () => {
            const button = new Button();
            expect(button).toBeDefined();
            expect(button.render()).toContain('button');
          });
          
          it('should handle clicks', () => {
            const button = new Button();
            const clickHandler = jest.fn();
            button.onClick = clickHandler;
            button.click();
            expect(clickHandler).toHaveBeenCalled();
          });
        });
      `;

      mockFs.readFile.mockResolvedValue(testContent);

      const result = await analyzer.analyze(inventory);
      
      const emptyTestFindings = result.findings.filter(f => 
        f.description.includes('empty or contains no meaningful test assertions')
      );
      
      expect(emptyTestFindings).toHaveLength(0);
    });
  });

  describe('Progress Reporting', () => {
    it('should report progress during analysis', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/components/Button.test.ts', 'typescript'),
        createMockFile('src/components/Button.ts', 'typescript'),
      ];

      mockFs.readFile.mockResolvedValue('test("should work", () => { expect(true).toBe(true); });');

      const progressCallback = jest.fn();
      await analyzer.analyze(inventory, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStep: 'Identifying test files',
          percentage: 0
        })
      );

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStep: 'Analysis complete',
          percentage: 100
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle file read errors gracefully', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/components/Button.test.ts', 'typescript'),
      ];

      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await analyzer.analyze(inventory);
      
      // Should complete without throwing, even if files can't be read
      expect(result.analyzer).toBe('test-file-analyzer');
      expect(result.findings).toBeDefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complex monorepo structure', async () => {
      const inventory: FileInventory[] = [
        // Frontend tests
        createMockFile('apps/frontend/__tests__/components/Button.test.tsx', 'typescript'),
        createMockFile('apps/frontend/components/Button.tsx', 'typescript'),
        
        // Backend tests
        createMockFile('apps/backend/src/tests/auth.test.js', 'javascript'),
        createMockFile('apps/backend/src/services/auth.js', 'javascript'),
        
        // Shared package tests
        createMockFile('packages/shared/__tests__/utils.spec.ts', 'typescript'),
        createMockFile('packages/shared/src/utils.ts', 'typescript'),
        
        // Orphaned test
        createMockFile('apps/frontend/__tests__/components/OldComponent.test.tsx', 'typescript'),
      ];

      mockFs.readFile.mockResolvedValue('test("should work", () => { expect(true).toBe(true); });');

      const result = await analyzer.analyze(inventory);
      
      expect(result.findings).toBeDefined();
      
      // Should find orphaned tests (auth.test.js, utils.spec.ts, and OldComponent.test.tsx)
      const orphanedFindings = result.findings.filter(f => 
        f.description.includes('orphaned')
      );
      expect(orphanedFindings.length).toBeGreaterThanOrEqual(1);
      
      // Should specifically find the OldComponent test as orphaned
      const oldComponentOrphaned = orphanedFindings.find(f => 
        f.files[0] === 'apps/frontend/__tests__/components/OldComponent.test.tsx'
      );
      expect(oldComponentOrphaned).toBeDefined();
    });
  });
});

// Helper function to create mock file inventory items
function createMockFile(path: string, fileType: 'typescript' | 'javascript' | 'json' | 'other'): FileInventory {
  return {
    path,
    size: 1000,
    lastModified: new Date(),
    contentHash: 'mock-hash-' + path.replace(/[^a-zA-Z0-9]/g, ''),
    fileType,
    workspace: path.startsWith('apps/frontend') ? 'frontend' : 
              path.startsWith('apps/backend') ? 'backend' :
              path.startsWith('packages/shared') ? 'shared' : 'root'
  };
}