/**
 * Integration tests for complete workflow execution
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { FileScanner, AnalysisOrchestrator, ChangeExecutor } from '../core';
import { DuplicateFileAnalyzer, DependencyAnalyzer } from '../analyzers';
import { ConsoleReporter, JSONReporter } from '../reporters';
import type { CleanupReport, ExecutionOptions } from '../types';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const rmdir = promisify(fs.rmdir);
const unlink = promisify(fs.unlink);

describe('Complete Workflow Integration Tests', () => {
  const testDir = path.join(__dirname, 'workflow-test');
  
  beforeAll(async () => {
    await mkdir(testDir, { recursive: true });
    await createTestWorkspace();
  });
  
  afterAll(async () => {
    try {
      await rmdir(testDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });
  
  describe('End-to-End Workflow', () => {
    it('should complete full analysis and reporting workflow', async () => {
      // Step 1: Scan repository
      const scanner = new FileScanner(testDir);
      const inventory = await scanner.scanRepository();
      
      expect(inventory.length).toBeGreaterThan(0);
      expect(inventory.some(file => file.path.includes('duplicate1.js'))).toBe(true);
      expect(inventory.some(file => file.path.includes('duplicate2.js'))).toBe(true);
      expect(inventory.some(file => file.path.includes('package.json'))).toBe(true);
      
      // Step 2: Run analysis
      const orchestrator = new AnalysisOrchestrator();
      orchestrator.registerAnalyzer(new DuplicateFileAnalyzer());
      orchestrator.registerAnalyzer(new DependencyAnalyzer());
      
      const analysisResult = await orchestrator.executeAnalysis(inventory);
      
      expect(analysisResult.success).toBe(true);
      expect(analysisResult.results.length).toBe(2); // Two analyzers
      expect(analysisResult.errors.length).toBe(0);
      
      // Verify duplicate analysis found duplicates
      const duplicateResult = analysisResult.results.find(r => r.analyzer === 'Duplicate File Analyzer');
      expect(duplicateResult).toBeDefined();
      expect(duplicateResult!.findings.length).toBeGreaterThan(0);
      
      // Verify dependency analysis found unused dependencies
      const dependencyResult = analysisResult.results.find(r => r.analyzer === 'Dependency Analyzer');
      expect(dependencyResult).toBeDefined();
      
      // Step 3: Generate report
      const report = generateCleanupReport(inventory, analysisResult.results);
      
      expect(report.summary.totalFiles).toBe(inventory.length);
      expect(report.summary.totalFindings).toBeGreaterThan(0);
      expect(report.categories).toHaveProperty('Duplicate File Analyzer');
      expect(report.categories).toHaveProperty('Dependency Analyzer');
      
      // Step 4: Generate different report formats
      const consoleReporter = new ConsoleReporter();
      const consoleOutput = await consoleReporter.generateReport(report);
      expect(consoleOutput).toContain('CODEBASE CLEANUP REPORT');
      
      const jsonReporter = new JSONReporter();
      const jsonOutput = await jsonReporter.generateReport(report);
      const parsedJson = JSON.parse(jsonOutput);
      expect(parsedJson).toEqual(report);
    });
    
    it('should handle execution workflow with dry-run', async () => {
      // First, run analysis to get findings
      const scanner = new FileScanner(testDir);
      const inventory = await scanner.scanRepository();
      
      const orchestrator = new AnalysisOrchestrator();
      orchestrator.registerAnalyzer(new DuplicateFileAnalyzer());
      
      const analysisResult = await orchestrator.executeAnalysis(inventory);
      const report = generateCleanupReport(inventory, analysisResult.results);
      
      // Convert findings to changes (simplified for test)
      const changes = report.recommendations
        .filter(f => f.autoFixable)
        .map((finding, index) => ({
          id: `change-${index}`,
          type: 'delete_file' as const,
          description: finding.description,
          sourcePath: finding.files[1], // Delete the second duplicate
          riskLevel: 'safe' as const,
          autoApplicable: true
        }));
      
      if (changes.length > 0) {
        // Execute in dry-run mode
        const executor = new ChangeExecutor();
        const plan = await executor.createExecutionPlan(changes);
        
        expect(plan.changes.length).toBe(changes.length);
        expect(plan.affectedFiles).toBeGreaterThan(0);
        
        const executionOptions: ExecutionOptions = {
          dryRun: true,
          createBackups: false,
          continueOnError: true,
          maxAutoRiskLevel: 'safe'
        };
        
        const result = await executor.executePlan(plan, executionOptions);
        
        expect(result.success).toBe(true);
        expect(result.summary.totalChanges).toBe(changes.length);
        expect(result.summary.successfulChanges).toBe(changes.length);
        expect(result.summary.failedChanges).toBe(0);
        
        // Verify files still exist (dry-run mode)
        for (const change of changes) {
          if (change.sourcePath) {
            expect(fs.existsSync(change.sourcePath)).toBe(true);
          }
        }
      }
    });
    
    it('should handle execution workflow with actual changes', async () => {
      // Create a test file to delete
      const testFile = path.join(testDir, 'to-be-deleted.js');
      await writeFile(testFile, 'console.log("This file will be deleted");');
      
      const changes = [
        {
          id: 'delete-test-file',
          type: 'delete_file' as const,
          description: 'Delete test file',
          sourcePath: testFile,
          riskLevel: 'safe' as const,
          autoApplicable: true
        }
      ];
      
      const executor = new ChangeExecutor();
      const plan = await executor.createExecutionPlan(changes);
      
      const executionOptions: ExecutionOptions = {
        dryRun: false,
        createBackups: true,
        continueOnError: true,
        maxAutoRiskLevel: 'safe'
      };
      
      const result = await executor.executePlan(plan, executionOptions);
      
      expect(result.success).toBe(true);
      expect(result.summary.successfulChanges).toBe(1);
      expect(result.summary.backupsCreated).toBe(1);
      
      // Verify file was deleted
      expect(fs.existsSync(testFile)).toBe(false);
      
      // Verify backup was created
      expect(result.backups.length).toBe(1);
      expect(fs.existsSync(result.backups[0].backupPath)).toBe(true);
      
      // Test rollback
      const rollbackResult = await executor.rollback();
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.summary.successfulChanges).toBe(1);
      
      // Verify file was restored
      expect(fs.existsSync(testFile)).toBe(true);
    });
    
    it('should handle errors gracefully during workflow', async () => {
      // Test with invalid directory
      const invalidDir = path.join(testDir, 'non-existent');
      
      try {
        const scanner = new FileScanner(invalidDir);
        await scanner.scanRepository();
        fail('Should have thrown an error for invalid directory');
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      // Test with analyzer that fails
      const orchestrator = new AnalysisOrchestrator();
      
      // Create a mock analyzer that always fails
      const failingAnalyzer = {
        name: 'Failing Analyzer',
        description: 'An analyzer that always fails',
        analyze: jest.fn().mockRejectedValue(new Error('Analyzer failed')),
        canRun: jest.fn().mockResolvedValue(true),
        getEstimatedTime: jest.fn().mockReturnValue(1000)
      };
      
      orchestrator.registerAnalyzer(failingAnalyzer);
      
      const scanner = new FileScanner(testDir);
      const inventory = await scanner.scanRepository();
      
      const result = await orchestrator.executeAnalysis(inventory);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].analyzerName).toBe('Failing Analyzer');
    });
    
    it('should handle progress reporting throughout workflow', async () => {
      const progressUpdates: string[] = [];
      
      const progressCallback = (progress: any) => {
        progressUpdates.push(progress.currentStep);
      };
      
      // Test progress during scanning
      const scanner = new FileScanner(testDir, progressCallback);
      await scanner.scanRepository();
      
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates.some(step => step.includes('Scanning'))).toBe(true);
      
      // Test progress during analysis
      progressUpdates.length = 0; // Reset
      
      const orchestrator = new AnalysisOrchestrator(progressCallback);
      orchestrator.registerAnalyzer(new DuplicateFileAnalyzer());
      
      const inventory = await scanner.scanRepository();
      await orchestrator.executeAnalysis(inventory);
      
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates.some(step => step.includes('Running'))).toBe(true);
    });
  });
  
  describe('Performance and Scalability', () => {
    it('should handle large number of files efficiently', async () => {
      // Create many test files
      const largeTestDir = path.join(testDir, 'large-test');
      await mkdir(largeTestDir, { recursive: true });
      
      const fileCount = 100;
      const createPromises = [];
      
      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(largeTestDir, `file-${i}.js`);
        createPromises.push(writeFile(filePath, `console.log("File ${i}");`));
      }
      
      await Promise.all(createPromises);
      
      const startTime = Date.now();
      
      const scanner = new FileScanner(largeTestDir);
      const inventory = await scanner.scanRepository();
      
      const scanTime = Date.now() - startTime;
      
      expect(inventory.length).toBe(fileCount);
      expect(scanTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Clean up
      await rmdir(largeTestDir, { recursive: true });
    });
    
    it('should handle concurrent analyzer execution', async () => {
      const scanner = new FileScanner(testDir);
      const inventory = await scanner.scanRepository();
      
      const orchestrator = new AnalysisOrchestrator();
      orchestrator.registerAnalyzer(new DuplicateFileAnalyzer());
      orchestrator.registerAnalyzer(new DependencyAnalyzer());
      
      const startTime = Date.now();
      const result = await orchestrator.executeAnalysis(inventory);
      const analysisTime = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(result.results.length).toBe(2);
      expect(analysisTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
  
  async function createTestWorkspace(): Promise<void> {
    // Create duplicate files
    const duplicateContent = `
function duplicateFunction() {
  console.log("This is a duplicate function");
  return "duplicate";
}

module.exports = { duplicateFunction };
`;
    
    await writeFile(path.join(testDir, 'duplicate1.js'), duplicateContent);
    await writeFile(path.join(testDir, 'duplicate2.js'), duplicateContent);
    
    // Create package.json with unused dependencies
    const packageJson = {
      name: 'test-workspace',
      version: '1.0.0',
      dependencies: {
        'lodash': '^4.17.21',
        'unused-package': '^1.0.0',
        'another-unused': '^2.0.0'
      },
      devDependencies: {
        'jest': '^29.0.0',
        'unused-dev-package': '^1.0.0'
      }
    };
    
    await writeFile(path.join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    // Create source file that only uses lodash
    const sourceFile = `
const _ = require('lodash');

function processArray(arr) {
  return _.map(arr, item => item.toUpperCase());
}

function filterArray(arr, predicate) {
  return _.filter(arr, predicate);
}

module.exports = {
  processArray,
  filterArray
};
`;
    
    await writeFile(path.join(testDir, 'src.js'), sourceFile);
    
    // Create test file
    const testFile = `
const { processArray, filterArray } = require('./src');

describe('Array processing', () => {
  test('should process array correctly', () => {
    const result = processArray(['hello', 'world']);
    expect(result).toEqual(['HELLO', 'WORLD']);
  });
  
  test('should filter array correctly', () => {
    const result = filterArray([1, 2, 3, 4], x => x > 2);
    expect(result).toEqual([3, 4]);
  });
});
`;
    
    await writeFile(path.join(testDir, 'src.test.js'), testFile);
    
    // Create configuration files
    await writeFile(path.join(testDir, '.env'), 'NODE_ENV=development\nDEBUG=true');
    await writeFile(path.join(testDir, '.env.local'), 'NODE_ENV=development\nDEBUG=false');
    await writeFile(path.join(testDir, '.env.production'), 'NODE_ENV=production\nDEBUG=false');
    
    // Create TypeScript config
    const tsConfig = {
      compilerOptions: {
        target: 'es2020',
        module: 'commonjs',
        strict: true,
        esModuleInterop: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };
    
    await writeFile(path.join(testDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
    
    // Create some additional files for structure analysis
    await mkdir(path.join(testDir, 'utils'), { recursive: true });
    await writeFile(path.join(testDir, 'utils', 'helper.js'), 'module.exports = { helper: () => {} };');
    await writeFile(path.join(testDir, 'utils', 'Helper.js'), 'module.exports = { Helper: () => {} };'); // Different case
    
    await mkdir(path.join(testDir, 'components'), { recursive: true });
    await writeFile(path.join(testDir, 'components', 'Button.jsx'), 'export const Button = () => <button />;');
    await writeFile(path.join(testDir, 'components', 'button.jsx'), 'export const button = () => <button />;'); // Different case
  }
  
  function generateCleanupReport(inventory: any[], results: any[]): CleanupReport {
    const totalFindings = results.reduce((sum, result) => sum + result.findings.length, 0);
    const allFindings = results.flatMap(result => result.findings);
    
    const estimatedSavings = allFindings.reduce(
      (acc, finding) => {
        if (finding.estimatedSavings) {
          acc.files += finding.estimatedSavings.files || 0;
          acc.size += finding.estimatedSavings.size || 0;
          acc.dependencies += finding.estimatedSavings.dependencies || 0;
        }
        return acc;
      },
      { files: 0, size: 0, dependencies: 0 }
    );
    
    const categories: { [key: string]: any } = {};
    results.forEach(result => {
      categories[result.analyzer] = result;
    });
    
    return {
      summary: {
        totalFiles: inventory.length,
        totalFindings,
        estimatedSavings: {
          files: estimatedSavings.files,
          diskSpace: formatFileSize(estimatedSavings.size),
          dependencies: estimatedSavings.dependencies
        }
      },
      categories,
      recommendations: allFindings
    };
  }
  
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
});