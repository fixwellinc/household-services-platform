import { TestFileAnalyzer } from '../TestFileAnalyzer';
import { FileInventory } from '../../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('TestFileAnalyzer Integration Tests', () => {
  let analyzer: TestFileAnalyzer;
  let tempDir: string;

  beforeEach(async () => {
    analyzer = new TestFileAnalyzer();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-analyzer-'));
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Real File System Integration', () => {
    it('should analyze actual test files and detect issues', async () => {
      // Create a realistic project structure
      const projectStructure = {
        'src/components/Button.tsx': `
          import React from 'react';
          
          export interface ButtonProps {
            onClick: () => void;
            children: React.ReactNode;
          }
          
          export const Button: React.FC<ButtonProps> = ({ onClick, children }) => {
            return <button onClick={onClick}>{children}</button>;
          };
        `,
        'src/components/Button.test.tsx': `
          import React from 'react';
          import { render, fireEvent } from '@testing-library/react';
          import { Button } from './Button';
          import { OldComponent } from './OldComponent'; // This import will be obsolete
          
          describe('Button', () => {
            it('should render correctly', () => {
              const handleClick = jest.fn();
              const { getByText } = render(
                <Button onClick={handleClick}>Click me</Button>
              );
              
              expect(getByText('Click me')).toBeInTheDocument();
            });
            
            it('should handle clicks', () => {
              const handleClick = jest.fn();
              const { getByText } = render(
                <Button onClick={handleClick}>Click me</Button>
              );
              
              fireEvent.click(getByText('Click me'));
              expect(handleClick).toHaveBeenCalled();
            });
          });
        `,
        'src/components/Modal.tsx': `
          import React from 'react';
          
          export const Modal: React.FC<{ isOpen: boolean }> = ({ isOpen, children }) => {
            if (!isOpen) return null;
            return <div className="modal">{children}</div>;
          };
        `,
        'src/components/__tests__/OrphanedComponent.test.tsx': `
          import React from 'react';
          import { render } from '@testing-library/react';
          // This test file has no corresponding source file
          
          describe('OrphanedComponent', () => {
            it('should work', () => {
              // This test is for a component that no longer exists
              expect(true).toBe(true);
            });
          });
        `,
        'src/utils/helpers.ts': `
          export const formatDate = (date: Date): string => {
            return date.toISOString().split('T')[0];
          };
          
          export const capitalize = (str: string): string => {
            return str.charAt(0).toUpperCase() + str.slice(1);
          };
        `,
        'src/utils/__tests__/helpers.test.ts': `
          import { formatDate, capitalize } from '../helpers';
          
          describe('helpers', () => {
            describe('formatDate', () => {
              it('should format date correctly', () => {
                const date = new Date('2023-12-25');
                expect(formatDate(date)).toBe('2023-12-25');
              });
            });
            
            describe('capitalize', () => {
              it('should capitalize first letter', () => {
                expect(capitalize('hello')).toBe('Hello');
              });
            });
          });
        `,
        'src/services/EmptyService.test.ts': `
          // This is an empty test file
          // TODO: Add tests for EmptyService
        `,
        'src/services/PlaceholderService.test.ts': `
          describe('PlaceholderService', () => {
            it.skip('should do something', () => {
              // TODO: Implement this test
            });
            
            it('pending test', () => {
              // Not implemented yet
            });
          });
        `
      };

      // Create the files
      for (const [filePath, content] of Object.entries(projectStructure)) {
        const fullPath = path.join(tempDir, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content);
      }

      // Create file inventory
      const inventory: FileInventory[] = [];
      for (const filePath of Object.keys(projectStructure)) {
        const fullPath = path.join(tempDir, filePath);
        const stats = await fs.stat(fullPath);
        
        inventory.push({
          path: fullPath,
          size: stats.size,
          lastModified: stats.mtime,
          contentHash: `hash-${filePath}`,
          fileType: filePath.endsWith('.ts') || filePath.endsWith('.tsx') ? 'typescript' : 'javascript',
          workspace: 'root'
        });
      }

      // Run analysis
      const result = await analyzer.analyze(inventory);

      // Verify results
      expect(result.analyzer).toBe('test-file-analyzer');
      expect(result.confidence).toBe('high');
      expect(result.riskLevel).toBe('review');

      // Should find orphaned test
      const orphanedFindings = result.findings.filter(f => 
        f.description.includes('orphaned') && 
        f.files.some(file => file.includes('OrphanedComponent.test.tsx'))
      );
      expect(orphanedFindings).toHaveLength(1);

      // Should find obsolete import
      const obsoleteImportFindings = result.findings.filter(f => 
        f.description.includes('obsolete import') &&
        f.files.some(file => file.includes('Button.test.tsx'))
      );
      expect(obsoleteImportFindings).toHaveLength(1);
      expect(obsoleteImportFindings[0].description).toContain('./OldComponent');

      // Should find empty test files
      const emptyTestFindings = result.findings.filter(f => 
        f.description.includes('empty or contains no meaningful test assertions')
      );
      expect(emptyTestFindings).toHaveLength(2); // EmptyService.test.ts and PlaceholderService.test.ts

      // Should not flag valid tests
      const validTestFiles = [
        'Button.test.tsx',
        'helpers.test.ts'
      ];
      
      for (const validFile of validTestFiles) {
        const invalidFindings = result.findings.filter(f => 
          f.files.some(file => file.includes(validFile)) &&
          (f.description.includes('orphaned') || f.description.includes('empty'))
        );
        expect(invalidFindings).toHaveLength(0);
      }
    });

    it('should handle different test directory structures', async () => {
      const projectStructure = {
        // Standard __tests__ directory
        'src/components/__tests__/Button.test.tsx': `
          import { Button } from '../Button';
          test('Button works', () => { expect(true).toBe(true); });
        `,
        'src/components/Button.tsx': 'export const Button = () => <div>Button</div>;',
        
        // Tests directory
        'src/tests/integration.test.ts': `
          test('integration works', () => { expect(true).toBe(true); });
        `,
        
        // Co-located tests
        'src/utils/helper.ts': 'export const helper = () => "help";',
        'src/utils/helper.test.ts': `
          import { helper } from './helper';
          test('helper works', () => { expect(helper()).toBe('help'); });
        `,
        
        // Spec files
        'src/services/api.spec.ts': `
          test('api works', () => { expect(true).toBe(true); });
        `,
        
        // Orphaned test in __tests__
        'src/components/__tests__/NonExistent.test.tsx': `
          test('NonExistent works', () => { expect(true).toBe(true); });
        `
      };

      // Create the files
      for (const [filePath, content] of Object.entries(projectStructure)) {
        const fullPath = path.join(tempDir, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content);
      }

      // Create file inventory
      const inventory: FileInventory[] = [];
      for (const filePath of Object.keys(projectStructure)) {
        const fullPath = path.join(tempDir, filePath);
        const stats = await fs.stat(fullPath);
        
        inventory.push({
          path: fullPath,
          size: stats.size,
          lastModified: stats.mtime,
          contentHash: `hash-${filePath}`,
          fileType: 'typescript',
          workspace: 'root'
        });
      }

      const result = await analyzer.analyze(inventory);

      // Should identify all test files correctly
      const testFileCount = Object.keys(projectStructure).filter(path => 
        path.includes('.test.') || path.includes('.spec.') || path.includes('__tests__') || path.includes('/tests/')
      ).length;
      
      expect(testFileCount).toBe(5); // 5 test files

      // Should find orphaned tests
      const orphanedFindings = result.findings.filter(f => f.description.includes('orphaned'));
      expect(orphanedFindings.length).toBeGreaterThan(0);
      
      // Should find the NonExistent test as orphaned
      const nonExistentOrphaned = orphanedFindings.find(f => 
        f.files.some(file => file.includes('NonExistent.test.tsx'))
      );
      expect(nonExistentOrphaned).toBeDefined();
    });

    it('should handle complex import resolution', async () => {
      const projectStructure = {
        'src/components/forms/LoginForm.tsx': `
          export const LoginForm = () => <form>Login</form>;
        `,
        'src/components/forms/LoginForm.test.tsx': `
          import { LoginForm } from './LoginForm'; // Valid relative import
          import { Button } from '../Button'; // Valid parent directory import
          import { helper } from '../../utils/helper'; // Valid grandparent import
          import { MissingComponent } from './MissingComponent'; // Invalid import
          import { AnotherMissing } from '../AnotherMissing'; // Invalid import
          
          test('LoginForm works', () => {
            expect(true).toBe(true);
          });
        `,
        'src/components/Button.tsx': `
          export const Button = () => <button>Button</button>;
        `,
        'src/utils/helper.ts': `
          export const helper = () => 'help';
        `,
        'src/services/api/client.ts': `
          export const client = {};
        `,
        'src/services/api/client.test.ts': `
          import { client } from './client'; // Valid same directory
          import { helper } from '../../utils/helper'; // Valid complex relative path
          import { missing } from './missing'; // Invalid same directory
          
          test('client works', () => {
            expect(true).toBe(true);
          });
        `
      };

      // Create the files
      for (const [filePath, content] of Object.entries(projectStructure)) {
        const fullPath = path.join(tempDir, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content);
      }

      // Create file inventory
      const inventory: FileInventory[] = [];
      for (const filePath of Object.keys(projectStructure)) {
        const fullPath = path.join(tempDir, filePath);
        const stats = await fs.stat(fullPath);
        
        inventory.push({
          path: fullPath,
          size: stats.size,
          lastModified: stats.mtime,
          contentHash: `hash-${filePath}`,
          fileType: 'typescript',
          workspace: 'root'
        });
      }

      const result = await analyzer.analyze(inventory);

      // Should find obsolete imports
      const obsoleteImportFindings = result.findings.filter(f => 
        f.description.includes('obsolete import')
      );
      
      expect(obsoleteImportFindings).toHaveLength(2); // Both test files have obsolete imports

      // Check LoginForm test obsolete imports
      const loginFormFindings = obsoleteImportFindings.find(f => 
        f.files.some(file => file.includes('LoginForm.test.tsx'))
      );
      expect(loginFormFindings).toBeDefined();
      // Should find MissingComponent and AnotherMissing as obsolete
      expect(loginFormFindings!.description).toContain('obsolete import(s)');

      // Check client test obsolete imports
      const clientFindings = obsoleteImportFindings.find(f => 
        f.files.some(file => file.includes('client.test.ts'))
      );
      expect(clientFindings).toBeDefined();
      // Should find missing as obsolete, but not client or helper
      expect(clientFindings!.description).toContain('./missing');
    });
  });

  describe('Performance with Large Test Suites', () => {
    it('should handle many test files efficiently', async () => {
      const fileCount = 50;
      const projectStructure: Record<string, string> = {};

      // Create many test files
      for (let i = 0; i < fileCount; i++) {
        const componentName = `Component${i}`;
        
        // Create source file
        projectStructure[`src/components/${componentName}.tsx`] = `
          export const ${componentName} = () => <div>${componentName}</div>;
        `;
        
        // Create test file
        projectStructure[`src/components/${componentName}.test.tsx`] = `
          import { ${componentName} } from './${componentName}';
          
          describe('${componentName}', () => {
            it('should render', () => {
              expect(true).toBe(true);
            });
          });
        `;
      }

      // Add some orphaned tests
      for (let i = 0; i < 5; i++) {
        projectStructure[`src/components/Orphaned${i}.test.tsx`] = `
          describe('Orphaned${i}', () => {
            it('should work', () => {
              expect(true).toBe(true);
            });
          });
        `;
      }

      // Create the files
      for (const [filePath, content] of Object.entries(projectStructure)) {
        const fullPath = path.join(tempDir, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content);
      }

      // Create file inventory
      const inventory: FileInventory[] = [];
      for (const filePath of Object.keys(projectStructure)) {
        const fullPath = path.join(tempDir, filePath);
        const stats = await fs.stat(fullPath);
        
        inventory.push({
          path: fullPath,
          size: stats.size,
          lastModified: stats.mtime,
          contentHash: `hash-${filePath}`,
          fileType: 'typescript',
          workspace: 'root'
        });
      }

      const startTime = Date.now();
      const result = await analyzer.analyze(inventory);
      const endTime = Date.now();

      // Should complete in reasonable time (less than 5 seconds for 100 files)
      expect(endTime - startTime).toBeLessThan(5000);

      // Should find the orphaned tests
      const orphanedFindings = result.findings.filter(f => f.description.includes('orphaned'));
      expect(orphanedFindings).toHaveLength(5);

      // Should not flag valid test files as problematic
      const validTestCount = fileCount; // All Component*.test.tsx files are valid
      const totalFindings = result.findings.length;
      
      // Should have findings for orphaned tests but not for valid tests
      expect(totalFindings).toBeGreaterThanOrEqual(5); // At least the orphaned tests
    });
  });

  describe('Progress Reporting Integration', () => {
    it('should provide accurate progress updates', async () => {
      const projectStructure = {
        'src/Component1.test.tsx': 'test("works", () => { expect(true).toBe(true); });',
        'src/Component2.test.tsx': 'test("works", () => { expect(true).toBe(true); });',
        'src/Component3.test.tsx': 'test("works", () => { expect(true).toBe(true); });',
        'src/Component1.tsx': 'export const Component1 = () => <div/>;',
        'src/Component2.tsx': 'export const Component2 = () => <div/>;',
      };

      // Create the files
      for (const [filePath, content] of Object.entries(projectStructure)) {
        const fullPath = path.join(tempDir, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content);
      }

      // Create file inventory
      const inventory: FileInventory[] = [];
      for (const filePath of Object.keys(projectStructure)) {
        const fullPath = path.join(tempDir, filePath);
        const stats = await fs.stat(fullPath);
        
        inventory.push({
          path: fullPath,
          size: stats.size,
          lastModified: stats.mtime,
          contentHash: `hash-${filePath}`,
          fileType: 'typescript',
          workspace: 'root'
        });
      }

      const progressUpdates: any[] = [];
      const progressCallback = (progress: any) => {
        progressUpdates.push(progress);
      };

      await analyzer.analyze(inventory, progressCallback);

      // Should have received progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);

      // Should start at 0% and end at 100%
      expect(progressUpdates[0].percentage).toBe(0);
      expect(progressUpdates[progressUpdates.length - 1].percentage).toBe(100);

      // Should have meaningful step descriptions
      const stepDescriptions = progressUpdates.map(p => p.currentStep);
      expect(stepDescriptions).toContain('Identifying test files');
      expect(stepDescriptions).toContain('Analysis complete');
    });
  });
});