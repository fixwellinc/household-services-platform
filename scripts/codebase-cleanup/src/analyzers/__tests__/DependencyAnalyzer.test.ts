import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DependencyAnalyzer } from '../DependencyAnalyzer';
import { FileInventory, FileType, WorkspaceType } from '../../types';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('DependencyAnalyzer', () => {
  let analyzer: DependencyAnalyzer;
  let tempDir: string;

  beforeEach(() => {
    analyzer = new DependencyAnalyzer();
    tempDir = path.join(os.tmpdir(), 'dependency-analyzer-test');
    jest.clearAllMocks();
  });

  describe('Basic Properties', () => {
    it('should have correct name and description', () => {
      expect(analyzer.name).toBe('dependency-analyzer');
      expect(analyzer.description).toContain('unused dependencies');
    });

    it('should always be able to run', async () => {
      const canRun = await analyzer.canRun();
      expect(canRun).toBe(true);
    });

    it('should estimate time based on inventory size', () => {
      const time = analyzer.getEstimatedTime(100);
      expect(time).toBe(200); // 2ms per file
    });
  });

  describe('Package File Detection', () => {
    it('should identify package.json files correctly', async () => {
      const inventory: FileInventory[] = [
        createMockFile('package.json', 'json', 'root'),
        createMockFile('apps/frontend/package.json', 'json', 'frontend'),
        createMockFile('apps/backend/package.json', 'json', 'backend'),
        createMockFile('node_modules/some-package/package.json', 'json', 'root'),
        createMockFile('.next/package.json', 'json', 'frontend'),
        createMockFile('src/index.ts', 'typescript', 'frontend'),
      ];

      // Mock package.json contents
      mockFs.readFileSync
        .mockReturnValueOnce('{"name": "root", "dependencies": {}}')
        .mockReturnValueOnce('{"name": "frontend", "dependencies": {}}')
        .mockReturnValueOnce('{"name": "backend", "dependencies": {}}');

      const result = await analyzer.analyze(inventory);

      expect(result.analyzer).toBe('dependency-analyzer');
      expect(result.confidence).toBe('high');
      expect(result.riskLevel).toBe('review');
    });
  });

  describe('Unused Dependencies Detection', () => {
    it('should detect unused production dependencies', async () => {
      const inventory: FileInventory[] = [
        createMockFile('package.json', 'json', 'root'),
        createMockFile('src/index.ts', 'typescript', 'root'),
      ];

      // Mock package.json with unused dependency
      const packageContent = {
        name: 'test-package',
        dependencies: {
          'lodash': '^4.17.21',
          'unused-package': '^1.0.0'
        }
      };

      // Mock source file with only lodash import
      const sourceContent = `import _ from 'lodash';\nconsole.log(_.isEmpty({}));`;

      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify(packageContent))
        .mockReturnValueOnce(sourceContent);

      const result = await analyzer.analyze(inventory);

      const unusedFindings = result.findings.filter(f => f.type === 'unused');
      expect(unusedFindings.length).toBeGreaterThan(0);
      
      // Check that unused-package is mentioned in the findings
      const hasUnusedPackage = result.findings.some(f => 
        f.recommendation.includes('unused-package')
      );
      expect(hasUnusedPackage).toBe(true);
    });

    it('should detect unused dev dependencies', async () => {
      const inventory: FileInventory[] = [
        createMockFile('package.json', 'json', 'root'),
        createMockFile('src/index.ts', 'typescript', 'root'),
      ];

      const packageContent = {
        name: 'test-package',
        devDependencies: {
          'typescript': '^5.0.0',
          'unused-dev-package': '^1.0.0'
        }
      };

      const sourceContent = `console.log('Hello World');`;

      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify(packageContent))
        .mockReturnValueOnce(sourceContent);

      const result = await analyzer.analyze(inventory);

      const unusedFindings = result.findings.filter(f => 
        f.type === 'unused' && f.description.includes('dev dependencies')
      );
      expect(unusedFindings).toHaveLength(1);
    });

    it('should not flag known runtime dependencies as unused', async () => {
      const inventory: FileInventory[] = [
        createMockFile('package.json', 'json', 'root'),
        createMockFile('src/index.ts', 'typescript', 'root'),
      ];

      const packageContent = {
        name: 'test-package',
        dependencies: {
          'next': '^14.0.0',
          'react': '^18.0.0',
          'express': '^4.18.0'
        }
      };

      const sourceContent = `console.log('Hello World');`;

      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify(packageContent))
        .mockReturnValueOnce(sourceContent);

      const result = await analyzer.analyze(inventory);

      const unusedFindings = result.findings.filter(f => f.type === 'unused');
      expect(unusedFindings).toHaveLength(0);
    });
  });

  describe('Import Statement Parsing', () => {
    it('should parse ES6 import statements', async () => {
      const inventory: FileInventory[] = [
        createMockFile('package.json', 'json', 'root'),
        createMockFile('src/index.ts', 'typescript', 'root'),
      ];

      const packageContent = {
        name: 'test-package',
        dependencies: {
          'lodash': '^4.17.21',
          'axios': '^1.0.0',
          'react': '^18.0.0'
        }
      };

      const sourceContent = `
        import _ from 'lodash';
        import { get } from 'axios';
        import * as React from 'react';
        import { Component } from 'react';
        import './styles.css';
      `;

      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify(packageContent))
        .mockReturnValueOnce(sourceContent);

      const result = await analyzer.analyze(inventory);

      // All dependencies should be considered used
      const unusedFindings = result.findings.filter(f => f.type === 'unused');
      expect(unusedFindings).toHaveLength(0);
    });

    it('should parse CommonJS require statements', async () => {
      const inventory: FileInventory[] = [
        createMockFile('package.json', 'json', 'root'),
        createMockFile('src/index.js', 'javascript', 'root'),
      ];

      const packageContent = {
        name: 'test-package',
        dependencies: {
          'express': '^4.18.0',
          'lodash': '^4.17.21'
        }
      };

      const sourceContent = `
        const express = require('express');
        const _ = require('lodash');
        const path = require('path');
      `;

      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify(packageContent))
        .mockReturnValueOnce(sourceContent);

      const result = await analyzer.analyze(inventory);

      const unusedFindings = result.findings.filter(f => f.type === 'unused');
      expect(unusedFindings).toHaveLength(0);
    });

    it('should parse dynamic import statements', async () => {
      const inventory: FileInventory[] = [
        createMockFile('package.json', 'json', 'root'),
        createMockFile('src/index.ts', 'typescript', 'root'),
      ];

      const packageContent = {
        name: 'test-package',
        dependencies: {
          'lodash': '^4.17.21'
        }
      };

      const sourceContent = `
        async function loadLodash() {
          const _ = await import('lodash');
          return _;
        }
      `;

      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify(packageContent))
        .mockReturnValueOnce(sourceContent);

      const result = await analyzer.analyze(inventory);

      const unusedFindings = result.findings.filter(f => f.type === 'unused');
      expect(unusedFindings).toHaveLength(0);
    });

    it('should handle scoped packages correctly', async () => {
      const inventory: FileInventory[] = [
        createMockFile('package.json', 'json', 'root'),
        createMockFile('src/index.ts', 'typescript', 'root'),
      ];

      const packageContent = {
        name: 'test-package',
        dependencies: {
          '@radix-ui/react-dialog': '^1.0.0'
        },
        devDependencies: {
          '@types/node': '^20.0.0'
        }
      };

      const sourceContent = `
        import { Dialog } from '@radix-ui/react-dialog';
        import type { Buffer } from '@types/node';
      `;

      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify(packageContent))
        .mockReturnValueOnce(sourceContent);

      const result = await analyzer.analyze(inventory);

      const unusedFindings = result.findings.filter(f => f.type === 'unused');
      expect(unusedFindings).toHaveLength(0);
    });
  });

  describe('Misplaced Dependencies Detection', () => {
    it('should detect dev dependencies used in production', async () => {
      const inventory: FileInventory[] = [
        createMockFile('package.json', 'json', 'root'),
        createMockFile('src/components/Button.tsx', 'typescript', 'root'),
      ];

      const packageContent = {
        name: 'test-package',
        devDependencies: {
          'lodash': '^4.17.21' // Should be in dependencies if used in src/
        }
      };

      const sourceContent = `
        import _ from 'lodash';
        export const Button = () => <button>{_.capitalize('hello')}</button>;
      `;

      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify(packageContent))
        .mockReturnValueOnce(sourceContent);

      const result = await analyzer.analyze(inventory);

      const misplacedFindings = result.findings.filter(f => 
        f.type === 'inconsistent' && f.description.includes('used in production')
      );
      expect(misplacedFindings).toHaveLength(1);
      expect(misplacedFindings[0].recommendation).toContain('Move to dependencies');
    });

    it('should detect production dependencies only used in development', async () => {
      const inventory: FileInventory[] = [
        createMockFile('package.json', 'json', 'root'),
        createMockFile('src/components/Button.test.tsx', 'typescript', 'root'),
      ];

      const packageContent = {
        name: 'test-package',
        dependencies: {
          '@testing-library/react': '^13.0.0' // Should be in devDependencies
        }
      };

      const sourceContent = `
        import { render } from '@testing-library/react';
        test('renders button', () => {
          render(<button>Test</button>);
        });
      `;

      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify(packageContent))
        .mockReturnValueOnce(sourceContent);

      const result = await analyzer.analyze(inventory);

      const misplacedFindings = result.findings.filter(f => 
        f.type === 'inconsistent' && f.description.includes('only used in development')
      );
      expect(misplacedFindings).toHaveLength(1);
      expect(misplacedFindings[0].recommendation).toContain('Move to devDependencies');
    });
  });

  describe('Workspace Detection', () => {
    it('should correctly identify workspaces', async () => {
      const inventory: FileInventory[] = [
        createMockFile('package.json', 'json', 'root'),
        createMockFile('apps/frontend/package.json', 'json', 'frontend'),
        createMockFile('apps/backend/package.json', 'json', 'backend'),
        createMockFile('packages/shared/package.json', 'json', 'shared'),
        createMockFile('packages/types/package.json', 'json', 'types'),
        createMockFile('packages/utils/package.json', 'json', 'utils'),
      ];

      // Mock all package.json files
      mockFs.readFileSync.mockReturnValue('{"name": "test", "dependencies": {}}');

      const result = await analyzer.analyze(inventory);

      expect(result.analyzer).toBe('dependency-analyzer');
      // Should process all 6 package.json files
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(6);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed package.json files gracefully', async () => {
      const inventory: FileInventory[] = [
        createMockFile('package.json', 'json', 'root'),
        createMockFile('src/index.ts', 'typescript', 'root'),
      ];

      // Mock malformed JSON
      mockFs.readFileSync
        .mockReturnValueOnce('{ invalid json }')
        .mockReturnValueOnce('console.log("test");');

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await analyzer.analyze(inventory);

      expect(result.findings).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle unreadable source files gracefully', async () => {
      const inventory: FileInventory[] = [
        createMockFile('package.json', 'json', 'root'),
        createMockFile('src/index.ts', 'typescript', 'root'),
      ];

      mockFs.readFileSync
        .mockReturnValueOnce('{"name": "test", "dependencies": {}}')
        .mockImplementationOnce(() => {
          throw new Error('Permission denied');
        });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await analyzer.analyze(inventory);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to read'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Progress Reporting', () => {
    it('should report progress during analysis', async () => {
      const inventory: FileInventory[] = [
        createMockFile('package.json', 'json', 'root'),
        createMockFile('src/index.ts', 'typescript', 'root'),
      ];

      mockFs.readFileSync
        .mockReturnValueOnce('{"name": "test", "dependencies": {}}')
        .mockReturnValueOnce('console.log("test");');

      const progressCallback = jest.fn();
      await analyzer.analyze(inventory, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStep: expect.stringContaining('Scanning package.json'),
          percentage: 0
        })
      );

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStep: expect.stringContaining('Analysis complete'),
          percentage: 100
        })
      );
    });
  });
});

/**
 * Helper function to create mock FileInventory objects
 */
function createMockFile(
  filePath: string, 
  fileType: FileType, 
  workspace: WorkspaceType
): FileInventory {
  return {
    path: filePath,
    size: 1000,
    lastModified: new Date(),
    contentHash: 'mock-hash-' + filePath.replace(/[^a-zA-Z0-9]/g, ''),
    fileType,
    workspace
  };
}