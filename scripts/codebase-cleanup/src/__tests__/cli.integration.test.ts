/**
 * Integration tests for the CLI interface
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { execSync } from 'child_process';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const rmdir = promisify(fs.rmdir);

describe('CLI Integration Tests', () => {
  const testDir = path.join(__dirname, 'test-workspace');
  const cliPath = path.join(__dirname, '../../dist/index.js');
  
  beforeAll(async () => {
    // Create test workspace
    await mkdir(testDir, { recursive: true });
    
    // Create some test files for analysis
    await createTestFiles();
  });
  
  afterAll(async () => {
    // Clean up test workspace
    try {
      await rmdir(testDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });
  
  describe('analyze command', () => {
    it('should run basic analysis with console output', async () => {
      const result = execSync(`node ${cliPath} analyze --dry-run`, {
        cwd: testDir,
        encoding: 'utf8'
      });
      
      expect(result).toContain('FixWell Codebase Cleanup Tool');
      expect(result).toContain('Scanning repository files');
      expect(result).toContain('Running analysis');
      expect(result).toContain('dry-run mode');
    });
    
    it('should generate JSON output', async () => {
      const outputFile = path.join(testDir, 'report.json');
      
      execSync(`node ${cliPath} analyze --dry-run --output-format json --output-file ${outputFile}`, {
        cwd: testDir
      });
      
      expect(fs.existsSync(outputFile)).toBe(true);
      
      const reportContent = await readFile(outputFile, 'utf8');
      const report = JSON.parse(reportContent);
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('categories');
      expect(report).toHaveProperty('recommendations');
      expect(report.summary).toHaveProperty('totalFiles');
      expect(report.summary).toHaveProperty('totalFindings');
    });
    
    it('should generate HTML output', async () => {
      const outputFile = path.join(testDir, 'report.html');
      
      execSync(`node ${cliPath} analyze --dry-run --output-format html --output-file ${outputFile}`, {
        cwd: testDir
      });
      
      expect(fs.existsSync(outputFile)).toBe(true);
      
      const htmlContent = await readFile(outputFile, 'utf8');
      expect(htmlContent).toContain('<html');
      expect(htmlContent).toContain('Codebase Cleanup Report');
    });
    
    it('should respect analyzer selection', async () => {
      const result = execSync(`node ${cliPath} analyze --dry-run --analyzers duplicates --verbose`, {
        cwd: testDir,
        encoding: 'utf8'
      });
      
      expect(result).toContain('Running analysis');
      // Should only run duplicate analyzer
      expect(result).toMatch(/duplicate/i);
    });
    
    it('should respect exclude patterns', async () => {
      const result = execSync(`node ${cliPath} analyze --dry-run --exclude "*.test.js,node_modules/**" --verbose`, {
        cwd: testDir,
        encoding: 'utf8'
      });
      
      expect(result).toContain('Scan complete');
      // Should exclude test files and node_modules
    });
  });
  
  describe('list-analyzers command', () => {
    it('should list available analyzers', () => {
      const result = execSync(`node ${cliPath} list-analyzers`, {
        encoding: 'utf8'
      });
      
      expect(result).toContain('Available Analyzers');
      expect(result).toContain('duplicates');
      expect(result).toContain('dependencies');
    });
  });
  
  describe('init-config command', () => {
    it('should generate default configuration file', async () => {
      const configFile = path.join(testDir, 'cleanup.config.json');
      
      execSync(`node ${cliPath} init-config --output ${configFile}`, {
        cwd: testDir
      });
      
      expect(fs.existsSync(configFile)).toBe(true);
      
      const configContent = await readFile(configFile, 'utf8');
      const config = JSON.parse(configContent);
      
      expect(config).toHaveProperty('excludePatterns');
      expect(config).toHaveProperty('includePatterns');
      expect(config).toHaveProperty('createBackups');
      expect(config).toHaveProperty('dryRun');
    });
  });
  
  describe('execute command', () => {
    it('should execute changes from plan file', async () => {
      // Create a test execution plan
      const planFile = path.join(testDir, 'test-plan.json');
      const testPlan = [
        {
          id: 'test-change-1',
          type: 'create_file',
          description: 'Create test file',
          targetPath: path.join(testDir, 'created-by-cli.txt'),
          content: 'This file was created by the CLI test',
          riskLevel: 'safe',
          autoApplicable: true
        }
      ];
      
      await writeFile(planFile, JSON.stringify(testPlan, null, 2));
      
      const result = execSync(`node ${cliPath} execute ${planFile} --dry-run`, {
        cwd: testDir,
        encoding: 'utf8'
      });
      
      expect(result).toContain('Loading execution plan');
      expect(result).toContain('Execution Plan Summary');
      expect(result).toContain('Total changes: 1');
    });
  });
  
  describe('error handling', () => {
    it('should handle invalid command gracefully', () => {
      expect(() => {
        execSync(`node ${cliPath} invalid-command`, {
          cwd: testDir,
          encoding: 'utf8'
        });
      }).toThrow();
    });
    
    it('should handle missing config file gracefully', () => {
      expect(() => {
        execSync(`node ${cliPath} analyze --config non-existent-config.json`, {
          cwd: testDir,
          encoding: 'utf8'
        });
      }).toThrow();
    });
    
    it('should handle invalid output format gracefully', () => {
      expect(() => {
        execSync(`node ${cliPath} analyze --output-format invalid`, {
          cwd: testDir,
          encoding: 'utf8'
        });
      }).toThrow();
    });
  });
  
  describe('configuration loading', () => {
    it('should load configuration from file', async () => {
      const configFile = path.join(testDir, 'custom-config.json');
      const customConfig = {
        excludePatterns: ['custom-exclude/**'],
        includePatterns: ['**/*.ts'],
        createBackups: false,
        dryRun: true
      };
      
      await writeFile(configFile, JSON.stringify(customConfig, null, 2));
      
      const result = execSync(`node ${cliPath} analyze --config ${configFile} --verbose`, {
        cwd: testDir,
        encoding: 'utf8'
      });
      
      expect(result).toContain('dry-run mode');
    });
  });
  
  async function createTestFiles(): Promise<void> {
    // Create some duplicate files for testing
    const duplicateContent = 'console.log("This is a duplicate file");';
    
    await writeFile(path.join(testDir, 'duplicate1.js'), duplicateContent);
    await writeFile(path.join(testDir, 'duplicate2.js'), duplicateContent);
    
    // Create a package.json with some dependencies
    const packageJson = {
      name: 'test-project',
      dependencies: {
        'lodash': '^4.17.21',
        'unused-package': '^1.0.0'
      },
      devDependencies: {
        'jest': '^29.0.0'
      }
    };
    
    await writeFile(path.join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    // Create a simple source file that uses lodash but not unused-package
    const sourceFile = `
const _ = require('lodash');

function processData(data) {
  return _.map(data, item => item.value);
}

module.exports = { processData };
`;
    
    await writeFile(path.join(testDir, 'index.js'), sourceFile);
    
    // Create some test files
    await writeFile(path.join(testDir, 'test.test.js'), 'describe("test", () => {});');
    
    // Create a config file
    await writeFile(path.join(testDir, '.env'), 'NODE_ENV=development');
    await writeFile(path.join(testDir, '.env.local'), 'NODE_ENV=development');
  }
});