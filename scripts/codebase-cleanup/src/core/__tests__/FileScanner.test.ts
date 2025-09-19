import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { FileScanner } from '../FileScanner';
import { FileInventory, ProgressInfo } from '../../types';

describe('FileScanner', () => {
  let tempDir: string;
  let scanner: FileScanner;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'file-scanner-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });

  describe('constructor', () => {
    it('should initialize with root path', () => {
      scanner = new FileScanner(tempDir);
      expect(scanner).toBeInstanceOf(FileScanner);
    });

    it('should accept progress callback', () => {
      const progressCallback = jest.fn();
      scanner = new FileScanner(tempDir, progressCallback);
      expect(scanner).toBeInstanceOf(FileScanner);
    });
  });

  describe('scanRepository', () => {
    beforeEach(() => {
      scanner = new FileScanner(tempDir);
    });

    it('should scan empty directory', async () => {
      const inventory = await scanner.scanRepository();
      expect(inventory).toEqual([]);
    });

    it('should scan single file', async () => {
      const testFile = path.join(tempDir, 'example.ts');
      await fs.promises.writeFile(testFile, 'console.log("example");');

      const inventory = await scanner.scanRepository();
      
      expect(inventory).toHaveLength(1);
      expect(inventory[0].path).toBe('example.ts');
      expect(inventory[0].fileType).toBe('typescript');
      expect(inventory[0].workspace).toBe('root');
      expect(inventory[0].size).toBeGreaterThan(0);
      expect(inventory[0].contentHash).toBeDefined();
      expect(typeof inventory[0].lastModified).toBe('object');
      expect(inventory[0].lastModified.constructor.name).toBe('Date');
    });

    it('should scan nested directories', async () => {
      // Create nested structure
      await fs.promises.mkdir(path.join(tempDir, 'apps', 'backend'), { recursive: true });
      await fs.promises.mkdir(path.join(tempDir, 'packages', 'shared'), { recursive: true });
      
      await fs.promises.writeFile(path.join(tempDir, 'apps', 'backend', 'server.js'), 'const express = require("express");');
      await fs.promises.writeFile(path.join(tempDir, 'packages', 'shared', 'utils.ts'), 'export const helper = () => {};');
      await fs.promises.writeFile(path.join(tempDir, 'README.md'), '# Test Project');

      const inventory = await scanner.scanRepository();
      
      expect(inventory).toHaveLength(3);
      
      const backendFile = inventory.find(f => f.path.includes('server.js'));
      expect(backendFile?.workspace).toBe('backend');
      expect(backendFile?.fileType).toBe('javascript');
      
      const sharedFile = inventory.find(f => f.path.includes('utils.ts'));
      expect(sharedFile?.workspace).toBe('shared');
      expect(sharedFile?.fileType).toBe('typescript');
      
      const readmeFile = inventory.find(f => f.path.includes('README.md'));
      expect(readmeFile?.workspace).toBe('root');
      expect(readmeFile?.fileType).toBe('markdown');
    });

    it('should respect .gitignore patterns', async () => {
      // Create .gitignore with explicit patterns
      await fs.promises.writeFile(path.join(tempDir, '.gitignore'), 'node_modules/\n*.log\n.env\n');
      
      // Create files that should be ignored
      await fs.promises.mkdir(path.join(tempDir, 'node_modules'), { recursive: true });
      await fs.promises.writeFile(path.join(tempDir, 'node_modules', 'package.json'), '{}');
      await fs.promises.writeFile(path.join(tempDir, 'debug.log'), 'log content');
      await fs.promises.writeFile(path.join(tempDir, '.env'), 'SECRET=value');
      
      // Create files that should be included
      await fs.promises.mkdir(path.join(tempDir, 'src'), { recursive: true });
      await fs.promises.writeFile(path.join(tempDir, 'src', 'index.ts'), 'export {};');

      // Create new scanner after .gitignore is created
      scanner = new FileScanner(tempDir);
      const inventory = await scanner.scanRepository();
      
      // Should only include the TypeScript file, not the ignored files or .gitignore
      expect(inventory).toHaveLength(1);
      expect(inventory[0].path).toBe(path.join('src', 'index.ts'));
    });

    it('should calculate consistent content hashes', async () => {
      const content = 'const test = "hello world";';
      await fs.promises.writeFile(path.join(tempDir, 'file1.js'), content);
      await fs.promises.writeFile(path.join(tempDir, 'file2.js'), content);

      const inventory = await scanner.scanRepository();
      
      expect(inventory).toHaveLength(2);
      expect(inventory[0].contentHash).toBe(inventory[1].contentHash);
    });

    it('should handle different file types correctly', async () => {
      const files = [
        { name: 'component.tsx', type: 'typescript' },
        { name: 'script.js', type: 'javascript' },
        { name: 'data.json', type: 'config' }, // JSON files are treated as config
        { name: 'styles.css', type: 'asset' },
        { name: 'example.spec.ts', type: 'test' },
        { name: 'package.json', type: 'config' },
        { name: 'unknown.xyz', type: 'other' }
      ];

      for (const file of files) {
        await fs.promises.writeFile(path.join(tempDir, file.name), 'content');
      }

      const inventory = await scanner.scanRepository();
      
      expect(inventory).toHaveLength(files.length);
      
      for (const file of files) {
        const inventoryItem = inventory.find(item => item.path === file.name);
        expect(inventoryItem?.fileType).toBe(file.type);
      }
    });

    it('should determine workspace correctly', async () => {
      const workspaceFiles = [
        { path: 'apps/backend/server.ts', workspace: 'backend' },
        { path: 'apps/frontend/app.tsx', workspace: 'frontend' },
        { path: 'packages/shared/utils.ts', workspace: 'shared' },
        { path: 'packages/types/index.ts', workspace: 'types' },
        { path: 'packages/utils/helpers.ts', workspace: 'utils' },
        { path: 'README.md', workspace: 'root' }
      ];

      for (const file of workspaceFiles) {
        const fullPath = path.join(tempDir, file.path);
        await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.promises.writeFile(fullPath, 'content');
      }

      const inventory = await scanner.scanRepository();
      
      expect(inventory).toHaveLength(workspaceFiles.length);
      
      for (const file of workspaceFiles) {
        const inventoryItem = inventory.find(item => item.path === file.path.replace(/\//g, path.sep));
        expect(inventoryItem?.workspace).toBe(file.workspace);
      }
    });

    it('should report progress when callback provided', async () => {
      const progressCallback = jest.fn();
      scanner = new FileScanner(tempDir, progressCallback);

      // Create multiple files to trigger progress reporting
      for (let i = 0; i < 5; i++) {
        await fs.promises.writeFile(path.join(tempDir, `file${i}.ts`), `export const value${i} = ${i};`);
      }

      await scanner.scanRepository();
      
      expect(progressCallback).toHaveBeenCalled();
      
      // Check that progress was reported with correct structure
      const calls = progressCallback.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      
      const lastCall = calls[calls.length - 1][0] as ProgressInfo;
      expect(lastCall.currentStep).toBe('File scan complete');
      expect(lastCall.percentage).toBe(100);
    });

    it('should skip very large files', async () => {
      // Create a file that would be considered too large (mock the size check)
      const largePath = path.join(tempDir, 'large.txt');
      await fs.promises.writeFile(largePath, 'small content');
      
      // Mock fs.promises.stat to return large size
      const originalStat = fs.promises.stat;
      jest.spyOn(fs.promises, 'stat').mockImplementation(async (path) => {
        const stats = await originalStat(path);
        if (path.toString().includes('large.txt')) {
          return { ...stats, size: 200 * 1024 * 1024 }; // 200MB
        }
        return stats;
      });

      const inventory = await scanner.scanRepository();
      
      expect(inventory).toHaveLength(0); // Large file should be skipped
      
      // Restore original implementation
      jest.restoreAllMocks();
    });

    it('should handle file access errors gracefully', async () => {
      await fs.promises.writeFile(path.join(tempDir, 'good.ts'), 'export {};');
      
      // Mock readFile to throw error for specific file
      const originalReadFile = fs.promises.readFile;
      jest.spyOn(fs.promises, 'readFile').mockImplementation(async (path, options) => {
        if (path.toString().includes('good.ts')) {
          throw new Error('Permission denied');
        }
        return originalReadFile(path, options);
      });

      const inventory = await scanner.scanRepository();
      
      // Should handle error gracefully and continue
      expect(inventory).toHaveLength(0);
      
      jest.restoreAllMocks();
    });
  });

  describe('gitignore pattern matching', () => {
    beforeEach(() => {
      scanner = new FileScanner(tempDir);
    });

    it('should ignore default patterns', async () => {
      // Create files matching default ignore patterns
      await fs.promises.mkdir(path.join(tempDir, 'node_modules'), { recursive: true });
      await fs.promises.writeFile(path.join(tempDir, 'node_modules', 'test.js'), 'module.exports = {};');
      await fs.promises.writeFile(path.join(tempDir, 'debug.log'), 'log entry');
      await fs.promises.writeFile(path.join(tempDir, '.DS_Store'), 'system file');
      
      const inventory = await scanner.scanRepository();
      
      expect(inventory).toHaveLength(0);
    });

    it('should handle complex gitignore patterns', async () => {
      const gitignoreContent = `# Comments should be ignored
*.tmp
/build/
**/*.backup
`;
      
      await fs.promises.writeFile(path.join(tempDir, '.gitignore'), gitignoreContent);
      
      // Create test files
      await fs.promises.writeFile(path.join(tempDir, 'temp.tmp'), 'temp');
      await fs.promises.mkdir(path.join(tempDir, 'build'), { recursive: true });
      await fs.promises.writeFile(path.join(tempDir, 'build', 'output.js'), 'build output');
      await fs.promises.writeFile(path.join(tempDir, 'file.backup'), 'backup');
      await fs.promises.writeFile(path.join(tempDir, 'valid.js'), 'valid file');

      // Create new scanner after .gitignore is created
      scanner = new FileScanner(tempDir);
      const inventory = await scanner.scanRepository();
      
      // Should only include valid.js (others should be ignored)
      expect(inventory).toHaveLength(1);
      expect(inventory[0].path).toBe('valid.js');
    });
  });
});