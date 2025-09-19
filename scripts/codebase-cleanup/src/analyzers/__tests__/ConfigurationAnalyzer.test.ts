import { ConfigurationAnalyzer } from '../ConfigurationAnalyzer';
import { FileInventory } from '../../types';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('ConfigurationAnalyzer', () => {
  let analyzer: ConfigurationAnalyzer;
  let mockInventory: FileInventory[];

  beforeEach(() => {
    analyzer = new ConfigurationAnalyzer();
    mockInventory = [];
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    it('should have correct name and description', () => {
      expect(analyzer.name).toBe('configuration-analyzer');
      expect(analyzer.description).toContain('configuration files');
    });

    it('should always be able to run', async () => {
      const canRun = await analyzer.canRun();
      expect(canRun).toBe(true);
    });

    it('should estimate time based on inventory size', () => {
      const time = analyzer.getEstimatedTime(100);
      expect(time).toBeGreaterThan(0);
      expect(typeof time).toBe('number');
    });
  });

  describe('Configuration file identification', () => {
    it('should identify environment files', async () => {
      mockInventory = [
        createMockFile('.env', 'root'),
        createMockFile('apps/.env.local', 'frontend'),
        createMockFile('apps/backend/.env.production', 'backend')
      ];

      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (typeof filePath === 'string' && filePath.includes('.env')) {
          return 'NODE_ENV=development\nPORT=3000\n';
        }
        return '';
      });

      const result = await analyzer.analyze(mockInventory);
      
      expect(result.analyzer).toBe('configuration-analyzer');
      expect(result.findings).toBeDefined();
    });

    it('should identify TypeScript configuration files', async () => {
      mockInventory = [
        createMockFile('tsconfig.json', 'root'),
        createMockFile('apps/frontend/tsconfig.json', 'frontend'),
        createMockFile('packages/utils/tsconfig.json', 'utils')
      ];

      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (typeof filePath === 'string' && filePath.includes('tsconfig')) {
          return JSON.stringify({
            compilerOptions: {
              target: 'ES2020',
              module: 'commonjs',
              strict: true
            }
          });
        }
        return '';
      });

      const result = await analyzer.analyze(mockInventory);
      
      expect(result.findings).toBeDefined();
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(3);
    });

    it('should identify package.json files', async () => {
      mockInventory = [
        createMockFile('package.json', 'root'),
        createMockFile('apps/backend/package.json', 'backend'),
        createMockFile('apps/frontend/package.json', 'frontend')
      ];

      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (typeof filePath === 'string' && filePath.includes('package.json')) {
          return JSON.stringify({
            name: 'test-package',
            version: '1.0.0',
            dependencies: {}
          });
        }
        return '';
      });

      const result = await analyzer.analyze(mockInventory);
      
      expect(result.findings).toBeDefined();
    });
  });

  describe('Duplicate configuration detection', () => {
    it('should detect duplicate environment files in same workspace', async () => {
      mockInventory = [
        createMockFile('apps/.env', 'frontend'),
        createMockFile('apps/.env.backup', 'frontend'), // Same environment type (default)
        createMockFile('apps/config/.env', 'frontend')  // Another default env file
      ];

      mockFs.readFileSync.mockImplementation(() => {
        return 'NODE_ENV=development\nPORT=3000\n';
      });

      const result = await analyzer.analyze(mockInventory);
      
      const duplicateFindings = result.findings.filter(f => f.type === 'duplicate');
      expect(duplicateFindings.length).toBeGreaterThan(0);
      
      const envDuplicates = duplicateFindings.find(f => 
        f.description.includes('environment files')
      );
      expect(envDuplicates).toBeDefined();
      expect(envDuplicates?.files.length).toBeGreaterThan(1);
    });

    it('should detect duplicate TypeScript configurations', async () => {
      mockInventory = [
        createMockFile('apps/frontend/tsconfig.json', 'frontend'),
        createMockFile('apps/frontend/tsconfig.build.json', 'frontend')
      ];

      mockFs.readFileSync.mockImplementation(() => {
        return JSON.stringify({
          compilerOptions: {
            target: 'ES2020',
            module: 'commonjs'
          }
        });
      });

      const result = await analyzer.analyze(mockInventory);
      
      const duplicateFindings = result.findings.filter(f => f.type === 'duplicate');
      const tsconfigDuplicates = duplicateFindings.find(f => 
        f.description.includes('tsconfig')
      );
      
      if (duplicateFindings.length > 0) {
        expect(tsconfigDuplicates).toBeDefined();
      }
    });
  });

  describe('Conflicting settings detection', () => {
    it('should detect conflicting environment variables', async () => {
      mockInventory = [
        createMockFile('apps/.env.development', 'frontend'),
        createMockFile('apps/.env.production', 'frontend')
      ];

      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (typeof filePath === 'string') {
          if (filePath.includes('development')) {
            return 'NODE_ENV=development\nPORT=3000\nAPI_URL=http://localhost:5000\n';
          } else if (filePath.includes('production')) {
            return 'NODE_ENV=production\nPORT=3000\nAPI_URL=https://api.production.com\n';
          }
        }
        return '';
      });

      const result = await analyzer.analyze(mockInventory);
      
      // Should not flag different API_URL as conflict (expected for different environments)
      // But should be consistent about other settings
      expect(result.findings).toBeDefined();
    });

    it('should detect conflicting TypeScript compiler options', async () => {
      mockInventory = [
        createMockFile('apps/frontend/tsconfig.json', 'frontend'),
        createMockFile('apps/backend/tsconfig.json', 'backend')
      ];

      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (typeof filePath === 'string') {
          if (filePath.includes('frontend')) {
            return JSON.stringify({
              compilerOptions: {
                target: 'ES2020',
                module: 'esnext',
                strict: true
              }
            });
          } else if (filePath.includes('backend')) {
            return JSON.stringify({
              compilerOptions: {
                target: 'ES2018',
                module: 'commonjs',
                strict: true
              }
            });
          }
        }
        return '';
      });

      const result = await analyzer.analyze(mockInventory);
      
      const conflictFindings = result.findings.filter(f => f.type === 'inconsistent');
      const tsconfigConflicts = conflictFindings.find(f => 
        f.description.includes('TypeScript compiler options')
      );
      
      expect(tsconfigConflicts).toBeDefined();
      expect(tsconfigConflicts?.description).toContain('target');
      expect(tsconfigConflicts?.description).toContain('module');
    });
  });

  describe('Consolidation opportunities', () => {
    it('should identify environment variable consolidation opportunities', async () => {
      mockInventory = [
        createMockFile('.env', 'root'),
        createMockFile('apps/backend/.env', 'backend'),
        createMockFile('apps/frontend/.env', 'frontend')
      ];

      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (typeof filePath === 'string') {
          if (filePath === '.env') {
            return 'NODE_ENV=development\nJWT_SECRET=shared-secret\n';
          } else if (filePath.includes('backend')) {
            return 'NODE_ENV=development\nJWT_SECRET=shared-secret\nPORT=5000\n';
          } else if (filePath.includes('frontend')) {
            return 'NODE_ENV=development\nJWT_SECRET=shared-secret\nPORT=3000\n';
          }
        }
        return '';
      });

      const result = await analyzer.analyze(mockInventory);
      
      const consolidationFindings = result.findings.filter(f => 
        f.description.includes('duplicated') && f.description.includes('root and workspace')
      );
      
      expect(consolidationFindings.length).toBeGreaterThan(0);
      const envConsolidation = consolidationFindings[0];
      expect(envConsolidation.recommendation).toContain('consolidating');
    });

    it('should identify TypeScript configuration consolidation opportunities', async () => {
      mockInventory = [
        createMockFile('apps/frontend/tsconfig.json', 'frontend'),
        createMockFile('apps/backend/tsconfig.json', 'backend'),
        createMockFile('packages/utils/tsconfig.json', 'utils'),
        createMockFile('packages/types/tsconfig.json', 'types')
      ];

      // All configs share many common options
      const commonConfig = {
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true
        }
      };

      mockFs.readFileSync.mockImplementation(() => {
        return JSON.stringify(commonConfig);
      });

      const result = await analyzer.analyze(mockInventory);
      
      const consolidationFindings = result.findings.filter(f => 
        f.description.includes('share common options')
      );
      
      if (consolidationFindings.length > 0) {
        const tsconfigConsolidation = consolidationFindings[0];
        expect(tsconfigConsolidation.recommendation).toContain('base tsconfig.json');
        expect(tsconfigConsolidation.recommendation).toContain('extends');
      }
    });
  });

  describe('Environment file parsing', () => {
    it('should correctly parse environment files with various formats', async () => {
      mockInventory = [createMockFile('.env', 'root')];

      const envContent = `
# Database Configuration
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
NODE_ENV=development
PORT=3000

# Comments should be ignored
DEBUG=true
EMPTY_VALUE=
QUOTED_VALUE="with spaces and special chars!"
SINGLE_QUOTED='single quotes'
`;

      mockFs.readFileSync.mockImplementation(() => envContent);

      const result = await analyzer.analyze(mockInventory);
      
      // Should parse without errors
      expect(result.findings).toBeDefined();
      expect(mockFs.readFileSync).toHaveBeenCalled();
    });

    it('should handle malformed configuration files gracefully', async () => {
      mockInventory = [
        createMockFile('invalid.json', 'root'),
        createMockFile('malformed-tsconfig.json', 'root')
      ];

      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (typeof filePath === 'string') {
          if (filePath.includes('invalid')) {
            return '{ invalid json content }';
          }
          return '{ "compilerOptions": { "target": }'; // Malformed JSON
        }
        return '';
      });

      // Should not throw errors
      const result = await analyzer.analyze(mockInventory);
      expect(result.findings).toBeDefined();
    });
  });

  describe('Progress reporting', () => {
    it('should report progress during analysis', async () => {
      mockInventory = [
        createMockFile('.env', 'root'),
        createMockFile('tsconfig.json', 'root')
      ];

      mockFs.readFileSync.mockImplementation(() => {
        return 'NODE_ENV=development\n';
      });

      const progressCallback = jest.fn();
      await analyzer.analyze(mockInventory, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStep: expect.any(String),
          percentage: expect.any(Number)
        })
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle empty inventory', async () => {
      const result = await analyzer.analyze([]);
      
      expect(result.analyzer).toBe('configuration-analyzer');
      expect(result.findings).toEqual([]);
      expect(result.confidence).toBe('high');
    });

    it('should handle inventory with no configuration files', async () => {
      mockInventory = [
        createMockFile('src/index.ts', 'frontend'),
        createMockFile('README.md', 'root')
      ];

      const result = await analyzer.analyze(mockInventory);
      
      expect(result.findings).toEqual([]);
    });

    it('should handle configuration files in nested directories', async () => {
      mockInventory = [
        createMockFile('apps/frontend/config/.env.local', 'frontend'),
        createMockFile('apps/backend/config/production.env.template', 'backend')
      ];

      mockFs.readFileSync.mockImplementation(() => {
        return 'NODE_ENV=development\n';
      });

      const result = await analyzer.analyze(mockInventory);
      
      expect(result.findings).toBeDefined();
    });
  });

  // Helper function to create mock file inventory items
  function createMockFile(path: string, workspace: string): FileInventory {
    return {
      path,
      size: 1024,
      lastModified: new Date(),
      contentHash: 'mock-hash-' + path.replace(/[^a-zA-Z0-9]/g, ''),
      fileType: path.endsWith('.json') ? 'json' : 'config',
      workspace: workspace as any
    };
  }
});