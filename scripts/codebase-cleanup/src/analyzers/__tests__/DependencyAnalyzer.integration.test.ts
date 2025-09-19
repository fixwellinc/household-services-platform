import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { DependencyAnalyzer } from '../DependencyAnalyzer';
import { FileScanner } from '../../core/FileScanner';

describe('DependencyAnalyzer Integration Tests', () => {
  let analyzer: DependencyAnalyzer;
  let tempDir: string;

  beforeEach(() => {
    analyzer = new DependencyAnalyzer();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dependency-analyzer-integration-'));
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Real Package Analysis', () => {
    it('should analyze a realistic monorepo structure', async () => {
      // Create a realistic monorepo structure
      const structure = {
        'package.json': {
          name: 'test-monorepo',
          dependencies: {
            'express': '^4.18.0',
            'lodash': '^4.17.21',
            'unused-root-dep': '^1.0.0'
          },
          devDependencies: {
            'typescript': '^5.0.0',
            'concurrently': '^8.0.0'
          }
        },
        'apps/frontend/package.json': {
          name: 'frontend-app',
          dependencies: {
            'react': '^18.0.0',
            'react-dom': '^18.0.0',
            'axios': '^1.0.0',
            'unused-frontend-dep': '^1.0.0'
          },
          devDependencies: {
            '@types/react': '^18.0.0',
            'eslint': '^8.0.0'
          }
        },
        'apps/backend/package.json': {
          name: 'backend-app',
          dependencies: {
            'express': '^4.18.0',
            'mongoose': '^7.0.0',
            'jsonwebtoken': '^9.0.0'
          },
          devDependencies: {
            '@types/express': '^4.17.0',
            'nodemon': '^3.0.0',
            'supertest': '^6.3.0'
          }
        }
      };

      const sourceFiles = {
        'apps/frontend/src/App.tsx': `
          import React from 'react';
          import axios from 'axios';
          
          export default function App() {
            return <div>Hello World</div>;
          }
        `,
        'apps/frontend/src/components/Button.test.tsx': `
          import { render } from '@testing-library/react';
          import Button from './Button';
          
          test('renders button', () => {
            render(<Button />);
          });
        `,
        'apps/backend/src/server.js': `
          const express = require('express');
          const jwt = require('jsonwebtoken');
          
          const app = express();
          app.listen(3000);
        `,
        'apps/backend/src/models/User.js': `
          const mongoose = require('mongoose');
          
          const userSchema = new mongoose.Schema({
            name: String
          });
          
          module.exports = mongoose.model('User', userSchema);
        `,
        'server.js': `
          const express = require('express');
          
          const app = express();
          app.listen(8000);
        `
      };

      // Create the file structure
      await createTestStructure(tempDir, structure, sourceFiles);

      // Scan the directory
      const scanner = new FileScanner(tempDir);
      const inventory = await scanner.scanRepository();

      // Analyze dependencies
      const result = await analyzer.analyze(inventory);

      // Verify results
      expect(result.analyzer).toBe('dependency-analyzer');
      expect(result.findings.length).toBeGreaterThan(0);

      // Should find unused dependencies
      const unusedFindings = result.findings.filter(f => f.type === 'unused');
      expect(unusedFindings.length).toBeGreaterThan(0);

      // Check for specific unused dependencies
      const unusedDeps = unusedFindings.flatMap(f => 
        f.recommendation.match(/unused-\w+-dep/g) || []
      );
      expect(unusedDeps).toContain('unused-root-dep');
      expect(unusedDeps).toContain('unused-frontend-dep');
    });

    it('should handle complex import patterns', async () => {
      const structure = {
        'package.json': {
          name: 'complex-imports',
          dependencies: {
            'lodash': '^4.17.21',
            '@radix-ui/react-dialog': '^1.0.0',
            'date-fns': '^2.29.0'
          }
        }
      };

      const sourceFiles = {
        'src/utils.ts': `
          // Various import patterns
          import _ from 'lodash';
          import { format } from 'date-fns';
          import * as Dialog from '@radix-ui/react-dialog';
          
          // Destructured imports
          import { 
            isEmpty, 
            isArray 
          } from 'lodash';
          
          // Dynamic imports
          async function loadUtils() {
            const { debounce } = await import('lodash');
            return debounce;
          }
          
          export { _, format, Dialog };
        `,
        'src/components.tsx': `
          import React from 'react';
          
          // Subpath imports
          import { Dialog } from '@radix-ui/react-dialog/dist/index';
          
          export const MyDialog = () => <Dialog.Root />;
        `
      };

      await createTestStructure(tempDir, structure, sourceFiles);

      const scanner = new FileScanner(tempDir);
      const inventory = await scanner.scanRepository();
      const result = await analyzer.analyze(inventory);

      // All dependencies should be detected as used
      const unusedFindings = result.findings.filter(f => f.type === 'unused');
      expect(unusedFindings).toHaveLength(0);
    });

    it('should detect misplaced dependencies correctly', async () => {
      const structure = {
        'package.json': {
          name: 'misplaced-deps',
          dependencies: {
            '@testing-library/react': '^13.0.0', // Should be devDep
            'jest': '^29.0.0' // Should be devDep
          },
          devDependencies: {
            'react': '^18.0.0', // Should be dep
            'lodash': '^4.17.21' // Should be dep
          }
        }
      };

      const sourceFiles = {
        'src/App.tsx': `
          import React from 'react';
          import _ from 'lodash';
          
          export default function App() {
            return <div>{_.capitalize('hello')}</div>;
          }
        `,
        'src/App.test.tsx': `
          import { render } from '@testing-library/react';
          import App from './App';
          
          test('renders app', () => {
            render(<App />);
          });
        `,
        'jest.config.js': `
          module.exports = {
            testEnvironment: 'jsdom'
          };
        `
      };

      await createTestStructure(tempDir, structure, sourceFiles);

      const scanner = new FileScanner(tempDir);
      const inventory = await scanner.scanRepository();
      const result = await analyzer.analyze(inventory);

      // Should find misplaced dependencies
      const misplacedFindings = result.findings.filter(f => f.type === 'inconsistent');
      expect(misplacedFindings.length).toBeGreaterThan(0);

      // Check for specific misplacements
      const toProd = misplacedFindings.find(f => 
        f.description.includes('used in production')
      );
      expect(toProd).toBeDefined();
      expect(toProd?.recommendation).toContain('react');
      expect(toProd?.recommendation).toContain('lodash');

      const toDev = misplacedFindings.find(f => 
        f.description.includes('only used in development')
      );
      expect(toDev).toBeDefined();
      expect(toDev?.recommendation).toContain('@testing-library/react');
    });
  });

  describe('Performance with Large Codebases', () => {
    it('should handle many files efficiently', async () => {
      // Create a structure with many files
      const structure = {
        'package.json': {
          name: 'large-codebase',
          dependencies: {
            'lodash': '^4.17.21',
            'react': '^18.0.0'
          }
        }
      };

      const sourceFiles: Record<string, string> = {};
      
      // Create 100 source files
      for (let i = 0; i < 100; i++) {
        sourceFiles[`src/component${i}.tsx`] = `
          import React from 'react';
          import _ from 'lodash';
          
          export const Component${i} = () => <div>{_.capitalize('test')}</div>;
        `;
      }

      await createTestStructure(tempDir, structure, sourceFiles);

      const scanner = new FileScanner(tempDir);
      const inventory = await scanner.scanRepository();

      const startTime = Date.now();
      const result = await analyzer.analyze(inventory);
      const endTime = Date.now();

      // Should complete in reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
      expect(result.findings).toBeDefined();
    });
  });
});

/**
 * Helper function to create test file structure
 */
async function createTestStructure(
  baseDir: string,
  packageFiles: Record<string, any>,
  sourceFiles: Record<string, string>
): Promise<void> {
  // Create package.json files
  for (const [filePath, content] of Object.entries(packageFiles)) {
    const fullPath = path.join(baseDir, filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, JSON.stringify(content, null, 2));
  }

  // Create source files
  for (const [filePath, content] of Object.entries(sourceFiles)) {
    const fullPath = path.join(baseDir, filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content);
  }
}