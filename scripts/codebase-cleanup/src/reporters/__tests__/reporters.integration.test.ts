/**
 * Integration tests for all reporters
 */

import { promises as fs } from 'fs';
import { ConsoleReporter, JSONReporter, HTMLReporter } from '../index';
import { CleanupReport } from '../../types';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    readFile: jest.fn()
  }
}));

describe('Reporters Integration', () => {
  let mockWriteFile: jest.MockedFunction<typeof fs.writeFile>;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockRestore();
  });

  const createComprehensiveReport = (): CleanupReport => ({
    summary: {
      totalFiles: 2500,
      totalFindings: 45,
      estimatedSavings: {
        files: 23,
        diskSpace: '15.7 MB',
        dependencies: 12
      }
    },
    categories: {
      'Duplicate File Analyzer': {
        analyzer: 'Duplicate File Analyzer',
        findings: [
          {
            type: 'duplicate',
            files: [
              'apps/frontend/src/utils/formatters.ts',
              'packages/shared/src/formatters.ts',
              'apps/backend/src/utils/formatters.ts'
            ],
            description: 'Duplicate formatter utilities found across workspaces',
            recommendation: 'Consolidate into packages/shared and update imports',
            autoFixable: true,
            estimatedSavings: { files: 2, size: 4096 }
          },
          {
            type: 'duplicate',
            files: [
              'apps/frontend/src/constants/api.ts',
              'apps/frontend/src/config/api.ts'
            ],
            description: 'Duplicate API configuration files',
            recommendation: 'Merge configurations and remove duplicate',
            autoFixable: false,
            estimatedSavings: { files: 1, size: 1024 }
          }
        ],
        confidence: 'high',
        riskLevel: 'safe'
      },
      'Dependency Analyzer': {
        analyzer: 'Dependency Analyzer',
        findings: [
          {
            type: 'unused',
            files: ['apps/frontend/package.json'],
            description: 'Unused dependencies: moment, underscore, jquery',
            recommendation: 'Remove unused dependencies to reduce bundle size',
            autoFixable: true,
            estimatedSavings: { dependencies: 3 }
          }
        ],
        confidence: 'high',
        riskLevel: 'safe'
      },
      'Dead Code Analyzer': {
        analyzer: 'Dead Code Analyzer',
        findings: [
          {
            type: 'obsolete',
            files: [
              'apps/backend/src/legacy/oldAuth.ts',
              'apps/backend/src/utils/deprecatedHelpers.ts'
            ],
            description: 'Legacy authentication and helper functions no longer used',
            recommendation: 'Remove obsolete code after confirming no external dependencies',
            autoFixable: false,
            estimatedSavings: { files: 2, size: 8192 }
          }
        ],
        confidence: 'medium',
        riskLevel: 'review'
      },
      'Configuration Analyzer': {
        analyzer: 'Configuration Analyzer',
        findings: [
          {
            type: 'inconsistent',
            files: [
              '.env.development',
              '.env.dev',
              'apps/frontend/.env.local',
              'apps/backend/.env.development'
            ],
            description: 'Inconsistent environment configuration files',
            recommendation: 'Standardize environment file naming and consolidate settings',
            autoFixable: false,
            estimatedSavings: { files: 2 }
          }
        ],
        confidence: 'low',
        riskLevel: 'manual'
      }
    },
    recommendations: [] // Will be populated from all findings
  });

  // Populate recommendations from categories
  const mockReport = createComprehensiveReport();
  mockReport.recommendations = Object.values(mockReport.categories)
    .flatMap(category => category.findings);

  describe('All Reporters Consistency', () => {
    it('should all be able to run', async () => {
      const consoleReporter = new ConsoleReporter();
      const jsonReporter = new JSONReporter();
      const htmlReporter = new HTMLReporter();

      expect(await consoleReporter.canRun()).toBe(true);
      expect(await jsonReporter.canRun()).toBe(true);
      expect(await htmlReporter.canRun()).toBe(true);
    });

    it('should all generate reports from the same data', async () => {
      const consoleReporter = new ConsoleReporter();
      const jsonReporter = new JSONReporter();
      const htmlReporter = new HTMLReporter();

      const consoleOutput = await consoleReporter.generateReport(mockReport);
      const jsonOutput = await jsonReporter.generateReport(mockReport);
      const htmlOutput = await htmlReporter.generateReport(mockReport);

      expect(consoleOutput).toBeTruthy();
      expect(jsonOutput).toBeTruthy();
      expect(htmlOutput).toBeTruthy();

      // All should contain key information
      expect(consoleOutput).toContain('2,500');
      expect(jsonOutput).toContain('2500');
      expect(htmlOutput).toContain('2,500');

      expect(consoleOutput).toContain('45');
      expect(jsonOutput).toContain('45');
      expect(htmlOutput).toContain('45');
    });

    it('should handle the same edge cases consistently', async () => {
      const emptyReport: CleanupReport = {
        summary: {
          totalFiles: 0,
          totalFindings: 0,
          estimatedSavings: { files: 0, diskSpace: '0 B', dependencies: 0 }
        },
        categories: {},
        recommendations: []
      };

      const consoleReporter = new ConsoleReporter();
      const jsonReporter = new JSONReporter();
      const htmlReporter = new HTMLReporter();

      const consoleOutput = await consoleReporter.generateReport(emptyReport);
      const jsonOutput = await jsonReporter.generateReport(emptyReport);
      const htmlOutput = await htmlReporter.generateReport(emptyReport);

      // All should handle empty reports gracefully
      expect(consoleOutput).toContain('0');
      expect(JSON.parse(jsonOutput).report.summary.totalFiles).toBe(0);
      expect(htmlOutput).toContain('0');
    });
  });

  describe('Cross-Format Data Integrity', () => {
    it('should preserve all data when converting between formats', async () => {
      const jsonReporter = new JSONReporter();
      
      // Generate JSON report
      const jsonOutput = await jsonReporter.generateReport(mockReport);
      const parsedJson = JSON.parse(jsonOutput);
      
      // Verify all original data is preserved
      expect(parsedJson.report.summary).toEqual(mockReport.summary);
      expect(parsedJson.report.categories).toEqual(mockReport.categories);
      expect(parsedJson.report.recommendations).toEqual(mockReport.recommendations);
    });

    it('should maintain finding relationships across formats', async () => {
      const consoleReporter = new ConsoleReporter();
      const jsonReporter = new JSONReporter();
      const htmlReporter = new HTMLReporter();

      const consoleOutput = await consoleReporter.generateReport(mockReport);
      const jsonOutput = await jsonReporter.generateReport(mockReport);
      const htmlOutput = await htmlReporter.generateReport(mockReport);

      // Check that all formats include the same findings
      const duplicateDescription = 'Duplicate formatter utilities found across workspaces';
      
      expect(consoleOutput).toContain(duplicateDescription);
      expect(jsonOutput).toContain(duplicateDescription);
      expect(htmlOutput).toContain(duplicateDescription);
    });
  });

  describe('File Output Integration', () => {
    it('should write all formats to files correctly', async () => {
      const consoleReporter = new ConsoleReporter();
      const jsonReporter = new JSONReporter();
      const htmlReporter = new HTMLReporter();

      // Generate reports with file output
      await consoleReporter.generateReport(mockReport); // Console doesn't write to file
      await jsonReporter.generateReport(mockReport, 'report.json');
      await htmlReporter.generateReport(mockReport, 'report.html');

      // Verify file writes
      expect(mockWriteFile).toHaveBeenCalledWith(
        'report.json',
        expect.stringContaining('"metadata"'),
        'utf8'
      );

      expect(mockWriteFile).toHaveBeenCalledWith(
        'report.html',
        expect.stringContaining('<!DOCTYPE html>'),
        'utf8'
      );
    });

    it('should handle file write errors consistently', async () => {
      const jsonReporter = new JSONReporter();
      const htmlReporter = new HTMLReporter();

      mockWriteFile.mockRejectedValue(new Error('Disk full'));

      await expect(
        jsonReporter.generateReport(mockReport, 'report.json')
      ).rejects.toThrow('Failed to write JSON report');

      await expect(
        htmlReporter.generateReport(mockReport, 'report.html')
      ).rejects.toThrow('Failed to write HTML report');
    });
  });

  describe('Performance Comparison', () => {
    it('should generate reports within reasonable time limits', async () => {
      const consoleReporter = new ConsoleReporter();
      const jsonReporter = new JSONReporter();
      const htmlReporter = new HTMLReporter();

      const startTime = Date.now();
      
      await Promise.all([
        consoleReporter.generateReport(mockReport),
        jsonReporter.generateReport(mockReport),
        htmlReporter.generateReport(mockReport)
      ]);

      const totalTime = Date.now() - startTime;
      
      // All reporters should complete within 1 second for this size report
      expect(totalTime).toBeLessThan(1000);
    });
  });

  describe('Large Report Handling', () => {
    it('should handle reports with many findings', async () => {
      // Create a report with many findings
      const largeReport: CleanupReport = {
        summary: {
          totalFiles: 10000,
          totalFindings: 500,
          estimatedSavings: { files: 200, diskSpace: '100 MB', dependencies: 50 }
        },
        categories: {},
        recommendations: []
      };

      // Generate 100 findings
      for (let i = 0; i < 100; i++) {
        largeReport.recommendations.push({
          type: 'duplicate',
          files: [`file${i}.ts`, `duplicate${i}.ts`],
          description: `Duplicate file ${i}`,
          recommendation: `Remove duplicate ${i}`,
          autoFixable: i % 2 === 0,
          estimatedSavings: { files: 1, size: 1024 }
        });
      }

      const consoleReporter = new ConsoleReporter();
      const jsonReporter = new JSONReporter();
      const htmlReporter = new HTMLReporter();

      // All should handle large reports without errors
      const consoleOutput = await consoleReporter.generateReport(largeReport);
      const jsonOutput = await jsonReporter.generateReport(largeReport);
      const htmlOutput = await htmlReporter.generateReport(largeReport);

      expect(consoleOutput).toBeTruthy();
      expect(jsonOutput).toBeTruthy();
      expect(htmlOutput).toBeTruthy();

      // Verify they contain expected data
      expect(consoleOutput).toContain('10,000');
      expect(consoleOutput).toContain('500');
      
      const parsedJson = JSON.parse(jsonOutput);
      expect(parsedJson.report.summary.totalFindings).toBe(500);
      
      expect(htmlOutput).toContain('10,000');
      expect(htmlOutput).toContain('500');
    });
  });

  describe('Special Characters and Encoding', () => {
    it('should handle special characters in file paths and descriptions', async () => {
      const specialReport: CleanupReport = {
        summary: {
          totalFiles: 1,
          totalFindings: 1,
          estimatedSavings: { files: 0, diskSpace: '0 B', dependencies: 0 }
        },
        categories: {
          'Test': {
            analyzer: 'Test',
            findings: [
              {
                type: 'duplicate',
                files: ['src/测试/file.ts', 'src/тест/файл.ts', 'src/🚀/rocket.ts'],
                description: 'Files with unicode: 测试 тест 🚀',
                recommendation: 'Handle unicode properly: ñáéíóú',
                autoFixable: true
              }
            ],
            confidence: 'high',
            riskLevel: 'safe'
          }
        },
        recommendations: [
          {
            type: 'duplicate',
            files: ['src/测试/file.ts', 'src/тест/файл.ts', 'src/🚀/rocket.ts'],
            description: 'Files with unicode: 测试 тест 🚀',
            recommendation: 'Handle unicode properly: ñáéíóú',
            autoFixable: true
          }
        ]
      };

      const consoleReporter = new ConsoleReporter();
      const jsonReporter = new JSONReporter();
      const htmlReporter = new HTMLReporter();

      // All should handle unicode without errors
      const consoleOutput = await consoleReporter.generateReport(specialReport);
      const jsonOutput = await jsonReporter.generateReport(specialReport);
      const htmlOutput = await htmlReporter.generateReport(specialReport);

      expect(consoleOutput).toContain('测试');
      expect(consoleOutput).toContain('🚀');
      
      expect(jsonOutput).toContain('测试');
      expect(jsonOutput).toContain('🚀');
      
      expect(htmlOutput).toContain('测试');
      expect(htmlOutput).toContain('🚀');
    });
  });
});