import { DeadCodeAnalyzer } from '../DeadCodeAnalyzer';
import { FileInventory } from '../../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('DeadCodeAnalyzer Integration Tests', () => {
  let analyzer: DeadCodeAnalyzer;
  let tempDir: string;
  
  beforeEach(async () => {
    analyzer = new DeadCodeAnalyzer();
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'dead-code-test-'));
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });

  describe('Real file analysis', () => {
    it('should detect unused functions in a real TypeScript file', async () => {
      // Create a sample TypeScript file with dead code
      const sampleCode = `
import { someExternalFunction } from 'external-lib';

// This function is used
export function usedFunction(param: string): string {
  return param.toUpperCase();
}

// This function is not used anywhere
export function unusedExportedFunction(param: number): number {
  return param * 2;
}

// This internal function is not used
function unusedInternalFunction(): void {
  console.log('This is never called');
}

// This variable is used
const usedVariable = 'hello';

// This variable is not used
const unusedVariable = 'goodbye';

// This class is not used
class UnusedClass {
  private value: string;
  
  constructor(value: string) {
    this.value = value;
  }
  
  getValue(): string {
    return this.value;
  }
}

// This interface is not used
interface UnusedInterface {
  id: number;
  name: string;
}

// This type is not used
type UnusedType = {
  status: 'active' | 'inactive';
};

// Usage of some symbols
console.log(usedVariable);
const result = usedFunction('test');
someExternalFunction();
      `;

      const filePath = path.join(tempDir, 'sample.ts');
      await fs.promises.writeFile(filePath, sampleCode);

      const inventory: FileInventory[] = [{
        path: filePath,
        size: sampleCode.length,
        lastModified: new Date(),
        contentHash: 'sample-hash',
        fileType: 'typescript',
        workspace: 'root'
      }];

      const result = await analyzer.analyze(inventory);

      expect(result.findings.length).toBeGreaterThan(0);
      
      // Should detect unused exported function
      const unusedExportFinding = result.findings.find(f => 
        f.description.includes('unusedExportedFunction')
      );
      expect(unusedExportFinding).toBeDefined();
      expect(unusedExportFinding?.autoFixable).toBe(false); // Exported symbols need review
      
      // Should detect unused internal symbols
      const unusedInternalFinding = result.findings.find(f => 
        f.description.includes('unusedInternalFunction') ||
        f.description.includes('unusedVariable') ||
        f.description.includes('UnusedClass')
      );
      expect(unusedInternalFinding).toBeDefined();
      expect(unusedInternalFinding?.autoFixable).toBe(true); // Internal symbols can be auto-fixed
    });

    it('should handle cross-file imports and exports correctly', async () => {
      // Create exporter file
      const exporterCode = `
export function exportedAndUsed(): string {
  return 'used in another file';
}

export function exportedButUnused(): string {
  return 'not used anywhere';
}

function internalFunction(): void {
  console.log('internal');
}
      `;

      // Create importer file
      const importerCode = `
import { exportedAndUsed } from './exporter';

function useImportedFunction(): void {
  const result = exportedAndUsed();
  console.log(result);
}

useImportedFunction();
      `;

      const exporterPath = path.join(tempDir, 'exporter.ts');
      const importerPath = path.join(tempDir, 'importer.ts');
      
      await fs.promises.writeFile(exporterPath, exporterCode);
      await fs.promises.writeFile(importerPath, importerCode);

      const inventory: FileInventory[] = [
        {
          path: exporterPath,
          size: exporterCode.length,
          lastModified: new Date(),
          contentHash: 'exporter-hash',
          fileType: 'typescript',
          workspace: 'root'
        },
        {
          path: importerPath,
          size: importerCode.length,
          lastModified: new Date(),
          contentHash: 'importer-hash',
          fileType: 'typescript',
          workspace: 'root'
        }
      ];

      const result = await analyzer.analyze(inventory);

      // Should detect exportedButUnused as unused
      const unusedExportFinding = result.findings.find(f => 
        f.description.includes('exportedButUnused')
      );
      expect(unusedExportFinding).toBeDefined();

      // Should detect internalFunction as unused
      const unusedInternalFinding = result.findings.find(f => 
        f.description.includes('internalFunction')
      );
      expect(unusedInternalFinding).toBeDefined();

      // Should NOT detect exportedAndUsed as unused (it's imported and used)
      const usedExportFinding = result.findings.find(f => 
        f.description.includes('exportedAndUsed')
      );
      expect(usedExportFinding).toBeUndefined();
    });

    it('should handle JavaScript files correctly', async () => {
      const jsCode = `
// CommonJS exports
function usedFunction() {
  return 'used';
}

function unusedFunction() {
  return 'unused';
}

const unusedVariable = 'not used';
const usedVariable = 'used';

// Usage
console.log(usedVariable);
module.exports = { usedFunction };
      `;

      const filePath = path.join(tempDir, 'sample.js');
      await fs.promises.writeFile(filePath, jsCode);

      const inventory: FileInventory[] = [{
        path: filePath,
        size: jsCode.length,
        lastModified: new Date(),
        contentHash: 'js-hash',
        fileType: 'javascript',
        workspace: 'root'
      }];

      const result = await analyzer.analyze(inventory);

      expect(result.findings.length).toBeGreaterThan(0);
      
      // Should detect unused function and variable
      const unusedFinding = result.findings.find(f => 
        f.description.includes('unusedFunction') || f.description.includes('unusedVariable')
      );
      expect(unusedFinding).toBeDefined();
    });

    it('should handle complex TypeScript patterns', async () => {
      const complexCode = `
// Enum that's not used
enum UnusedEnum {
  VALUE1 = 'value1',
  VALUE2 = 'value2'
}

// Enum that's used
enum UsedEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

// Generic interface not used
interface UnusedGeneric<T> {
  data: T;
  process(): T;
}

// Generic interface that's used
interface UsedGeneric<T> {
  value: T;
}

// Abstract class not used
abstract class UnusedAbstractClass {
  abstract doSomething(): void;
}

// Namespace not used
namespace UnusedNamespace {
  export function helper(): void {
    console.log('helper');
  }
}

// Usage
const status: UsedEnum = UsedEnum.ACTIVE;
const container: UsedGeneric<string> = { value: 'test' };

console.log(status, container);
      `;

      const filePath = path.join(tempDir, 'complex.ts');
      await fs.promises.writeFile(filePath, complexCode);

      const inventory: FileInventory[] = [{
        path: filePath,
        size: complexCode.length,
        lastModified: new Date(),
        contentHash: 'complex-hash',
        fileType: 'typescript',
        workspace: 'root'
      }];

      const result = await analyzer.analyze(inventory);

      expect(result.findings.length).toBeGreaterThan(0);
      
      // Should detect unused enum, interface, class, and namespace
      const unusedSymbols = ['UnusedEnum', 'UnusedGeneric', 'UnusedAbstractClass', 'UnusedNamespace'];
      
      for (const symbol of unusedSymbols) {
        const finding = result.findings.find(f => f.description.includes(symbol));
        expect(finding).toBeDefined();
      }
      
      // Should NOT detect used symbols
      const usedSymbols = ['UsedEnum', 'UsedGeneric'];
      for (const symbol of usedSymbols) {
        const finding = result.findings.find(f => f.description.includes(symbol));
        expect(finding).toBeUndefined();
      }
    });

    it('should respect dynamic usage patterns and skip them', async () => {
      const dynamicCode = `
// API route handlers - should be skipped
export function getUsers() {
  return [];
}

export function postUser() {
  return {};
}

export function deleteUser() {
  return {};
}

// React components - should be skipped
export const UserComponent = () => {
  return <div>User</div>;
}

export const AdminPanel = () => {
  return <div>Admin</div>;
}

// Main function - should be skipped
export function main() {
  console.log('Starting application');
}

// Regular unused function - should be detected
export function reallyUnusedFunction() {
  return 'this is truly unused';
}

// Test functions - should be skipped
function describe() {}
function it() {}
function beforeEach() {}
      `;

      const filePath = path.join(tempDir, 'dynamic.ts');
      await fs.promises.writeFile(filePath, dynamicCode);

      const inventory: FileInventory[] = [{
        path: filePath,
        size: dynamicCode.length,
        lastModified: new Date(),
        contentHash: 'dynamic-hash',
        fileType: 'typescript',
        workspace: 'root'
      }];

      const result = await analyzer.analyze(inventory);

      // Should only detect reallyUnusedFunction
      const unusedFinding = result.findings.find(f => 
        f.description.includes('reallyUnusedFunction')
      );
      expect(unusedFinding).toBeDefined();

      // Should NOT detect API handlers, React components, main function, or test functions
      const skippedPatterns = ['getUsers', 'postUser', 'deleteUser', 'UserComponent', 'AdminPanel', 'main', 'describe', 'it', 'beforeEach'];
      
      for (const pattern of skippedPatterns) {
        const finding = result.findings.find(f => f.description.includes(pattern));
        expect(finding).toBeUndefined();
      }
    });

    it('should handle files in special locations correctly', async () => {
      // Create index file
      const indexCode = `
export function indexFunction() {
  return 'from index';
}
      `;

      // Create types file
      const typesCode = `
export interface ApiResponse {
  data: any;
  status: number;
}

export type UserRole = 'admin' | 'user';
      `;

      const indexPath = path.join(tempDir, 'index.ts');
      const typesPath = path.join(tempDir, 'packages', 'types', 'api.ts');
      
      // Create directory structure
      await fs.promises.mkdir(path.dirname(typesPath), { recursive: true });
      
      await fs.promises.writeFile(indexPath, indexCode);
      await fs.promises.writeFile(typesPath, typesCode);

      const inventory: FileInventory[] = [
        {
          path: indexPath,
          size: indexCode.length,
          lastModified: new Date(),
          contentHash: 'index-hash',
          fileType: 'typescript',
          workspace: 'root'
        },
        {
          path: typesPath,
          size: typesCode.length,
          lastModified: new Date(),
          contentHash: 'types-hash',
          fileType: 'typescript',
          workspace: 'types'
        }
      ];

      const result = await analyzer.analyze(inventory);

      // Should NOT flag exports from index files or types packages as unused
      const indexFinding = result.findings.find(f => f.description.includes('indexFunction'));
      const apiResponseFinding = result.findings.find(f => f.description.includes('ApiResponse'));
      const userRoleFinding = result.findings.find(f => f.description.includes('UserRole'));

      expect(indexFinding).toBeUndefined();
      expect(apiResponseFinding).toBeUndefined();
      expect(userRoleFinding).toBeUndefined();
    });
  });

  describe('Performance and error handling', () => {
    it('should handle large files efficiently', async () => {
      // Create a large file with many symbols
      let largeCode = '';
      for (let i = 0; i < 100; i++) {
        largeCode += `
function unusedFunction${i}() {
  return ${i};
}

const unusedVariable${i} = ${i};
        `;
      }

      const filePath = path.join(tempDir, 'large.ts');
      await fs.promises.writeFile(filePath, largeCode);

      const inventory: FileInventory[] = [{
        path: filePath,
        size: largeCode.length,
        lastModified: new Date(),
        contentHash: 'large-hash',
        fileType: 'typescript',
        workspace: 'root'
      }];

      const startTime = Date.now();
      const result = await analyzer.analyze(inventory);
      const endTime = Date.now();

      expect(result.findings.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle syntax errors gracefully', async () => {
      const invalidCode = `
function validFunction() {
  return 'valid';
}

// Syntax error below
function invalidFunction( {
  return 'invalid syntax';
}

const anotherValidFunction = () => {
  return 'also valid';
};
      `;

      const filePath = path.join(tempDir, 'invalid.ts');
      await fs.promises.writeFile(filePath, invalidCode);

      const inventory: FileInventory[] = [{
        path: filePath,
        size: invalidCode.length,
        lastModified: new Date(),
        contentHash: 'invalid-hash',
        fileType: 'typescript',
        workspace: 'root'
      }];

      // Should not throw an error
      const result = await analyzer.analyze(inventory);
      expect(result).toBeDefined();
      expect(result.analyzer).toBe('dead-code-analyzer');
    });
  });
});