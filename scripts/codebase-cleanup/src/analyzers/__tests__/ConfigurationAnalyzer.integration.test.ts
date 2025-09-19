// Integration test file
import { ConfigurationAnalyzer } from '../ConfigurationAnalyzer';
import { FileScanner } from '../../core/FileScanner';
import { FileInventory } from '../../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ConfigurationAnalyzer Integration Tests', () => {
  let analyzer: ConfigurationAnalyzer;
  let tempDir: string;
  let scanner: FileScanner;

  beforeAll(async () => {
    analyzer = new ConfigurationAnalyzer();
    
    // Create temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-analyzer-test-'));
    
    // Create test configuration files
    await createTestConfigFiles();
    
    // Initialize scanner with temp directory
    scanner = new FileScanner(tempDir);
  });

  afterAll(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Real configuration file analysis', () => {
    it('should analyze duplicate environment files', async () => {
      const inventory = await scanner.scanRepository();
      const result = await analyzer.analyze(inventory);

      expect(result.analyzer).toBe('configuration-analyzer');
      expect(result.findings.length).toBeGreaterThan(0);

      // Should find duplicate .env files
      const duplicateFindings = result.findings.filter(f => f.type === 'duplicate');
      expect(duplicateFindings.length).toBeGreaterThan(0);

      const envDuplicates = duplicateFindings.find(f => 
        f.description.includes('environment files')
      );
      expect(envDuplicates).toBeDefined();
    });

    it('should detect conflicting settings across environments', async () => {
      const inventory = await scanner.scanRepository();
      const result = await analyzer.analyze(inventory);

      const conflictFindings = result.findings.filter(f => f.type === 'inconsistent');
      
      // Should find conflicts in environment variables
      const envConflicts = conflictFindings.find(f => 
        f.description.includes('Conflicting values')
      );
      
      if (envConflicts) {
        expect(envConflicts.files.length).toBeGreaterThan(1);
        expect(envConflicts.recommendation).toContain('standardize');
      }
    });

    it('should identify TypeScript configuration conflicts', async () => {
      const inventory = await scanner.scanRepository();
      const result = await analyzer.analyze(inventory);

      const tsconfigConflicts = result.findings.filter(f => 
        f.type === 'inconsistent' && f.description.includes('TypeScript')
      );

      if (tsconfigConflicts.length > 0) {
        const conflict = tsconfigConflicts[0];
        expect(conflict.files.length).toBe(2);
        expect(conflict.recommendation).toContain('Standardize');
      }
    });

    it('should suggest consolidation opportunities', async () => {
      const inventory = await scanner.scanRepository();
      const result = await analyzer.analyze(inventory);

      const consolidationFindings = result.findings.filter(f => 
        f.recommendation.includes('consolidat')
      );

      if (consolidationFindings.length > 0) {
        const consolidation = consolidationFindings[0];
        expect(consolidation.autoFixable).toBe(false); // Should require manual review
      }
    });

    it('should provide accurate file savings estimates', async () => {
      const inventory = await scanner.scanRepository();
      const result = await analyzer.analyze(inventory);

      const findingsWithSavings = result.findings.filter(f => f.estimatedSavings);
      
      for (const finding of findingsWithSavings) {
        if (finding.estimatedSavings?.files) {
          expect(finding.estimatedSavings.files).toBeGreaterThan(0);
        }
        if (finding.estimatedSavings?.size) {
          expect(finding.estimatedSavings.size).toBeGreaterThan(0);
        }
      }
    });

    it('should handle progress reporting correctly', async () => {
      const inventory = await scanner.scanRepository();
      
      const progressUpdates: number[] = [];
      const progressCallback = (progress: any) => {
        progressUpdates.push(progress.percentage);
      };

      await analyzer.analyze(inventory, progressCallback);

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0]).toBe(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
      
      // Progress should be monotonically increasing
      for (let i = 1; i < progressUpdates.length; i++) {
        expect(progressUpdates[i]).toBeGreaterThanOrEqual(progressUpdates[i - 1]);
      }
    });
  });

  describe('Performance tests', () => {
    it('should complete analysis within reasonable time', async () => {
      const inventory = await scanner.scanRepository();
      
      const startTime = Date.now();
      await analyzer.analyze(inventory);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds for small test directory
      expect(duration).toBeLessThan(5000);
    });

    it('should provide reasonable time estimates', () => {
      const smallEstimate = analyzer.getEstimatedTime(10);
      const largeEstimate = analyzer.getEstimatedTime(1000);
      
      expect(largeEstimate).toBeGreaterThan(smallEstimate);
      expect(smallEstimate).toBeGreaterThan(0);
    });
  });

  async function createTestConfigFiles() {
    // Create directory structure
    const dirs = [
      'apps/frontend',
      'apps/backend', 
      'packages/utils',
      'packages/types'
    ];

    for (const dir of dirs) {
      fs.mkdirSync(path.join(tempDir, dir), { recursive: true });
    }

    // Create root .env file
    fs.writeFileSync(path.join(tempDir, '.env'), `
# Root environment configuration
NODE_ENV=development
JWT_SECRET=shared-secret-key
DATABASE_URL=postgresql://localhost:5432/app
PORT=3000
`);

    // Create frontend .env files (duplicates)
    fs.writeFileSync(path.join(tempDir, 'apps/frontend/.env'), `
NODE_ENV=development
JWT_SECRET=shared-secret-key
NEXT_PUBLIC_API_URL=http://localhost:5000
PORT=3000
`);

    fs.writeFileSync(path.join(tempDir, 'apps/frontend/.env.local'), `
NODE_ENV=development
JWT_SECRET=different-secret-key
NEXT_PUBLIC_API_URL=http://localhost:5000
PORT=3001
`);

    // Create backend .env file
    fs.writeFileSync(path.join(tempDir, 'apps/backend/.env'), `
NODE_ENV=development
JWT_SECRET=shared-secret-key
DATABASE_URL=postgresql://localhost:5432/app
PORT=5000
CORS_ORIGINS=http://localhost:3000
`);

    // Create TypeScript configurations with conflicts
    const frontendTsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'esnext',
        lib: ['dom', 'dom.iterable', 'es6'],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        jsx: 'preserve'
      },
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['node_modules']
    };

    const backendTsConfig = {
      compilerOptions: {
        target: 'ES2018', // Different target
        module: 'commonjs', // Different module system
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        outDir: './dist',
        rootDir: './src'
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };

    const utilsTsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        declaration: true,
        outDir: './dist'
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };

    fs.writeFileSync(
      path.join(tempDir, 'apps/frontend/tsconfig.json'),
      JSON.stringify(frontendTsConfig, null, 2)
    );

    fs.writeFileSync(
      path.join(tempDir, 'apps/backend/tsconfig.json'),
      JSON.stringify(backendTsConfig, null, 2)
    );

    fs.writeFileSync(
      path.join(tempDir, 'packages/utils/tsconfig.json'),
      JSON.stringify(utilsTsConfig, null, 2)
    );

    // Create package.json files
    const rootPackage = {
      name: 'test-monorepo',
      version: '1.0.0',
      workspaces: ['apps/*', 'packages/*'],
      devDependencies: {
        typescript: '^5.0.0',
        '@types/node': '^20.0.0'
      }
    };

    const frontendPackage = {
      name: '@test/frontend',
      version: '1.0.0',
      dependencies: {
        react: '^18.0.0',
        'next': '^14.0.0'
      },
      devDependencies: {
        typescript: '^5.0.0',
        '@types/react': '^18.0.0'
      }
    };

    const backendPackage = {
      name: '@test/backend',
      version: '1.0.0',
      dependencies: {
        express: '^4.18.0',
        cors: '^2.8.5'
      },
      devDependencies: {
        typescript: '^5.0.0',
        '@types/express': '^4.17.0'
      }
    };

    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify(rootPackage, null, 2)
    );

    fs.writeFileSync(
      path.join(tempDir, 'apps/frontend/package.json'),
      JSON.stringify(frontendPackage, null, 2)
    );

    fs.writeFileSync(
      path.join(tempDir, 'apps/backend/package.json'),
      JSON.stringify(backendPackage, null, 2)
    );

    // Create some additional config files for variety
    fs.writeFileSync(path.join(tempDir, '.eslintrc.json'), JSON.stringify({
      extends: ['eslint:recommended'],
      env: { node: true, es2020: true },
      rules: {}
    }, null, 2));

    fs.writeFileSync(path.join(tempDir, 'apps/frontend/.eslintrc.json'), JSON.stringify({
      extends: ['eslint:recommended', 'next/core-web-vitals'],
      env: { browser: true, es2020: true },
      rules: {}
    }, null, 2));
  }
});