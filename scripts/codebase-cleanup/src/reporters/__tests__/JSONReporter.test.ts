/**
 * Tests for JSONReporter
 */

import { promises as fs } from 'fs';
import { JSONReporter } from '../JSONReporter';
import { CleanupReport } from '../../types';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    readFile: jest.fn()
  }
}));

describe('JSONReporter', () => {
  let reporter: JSONReporter;
  let mockWriteFile: jest.MockedFunction<typeof fs.writeFile>;
  let mockReadFile: jest.MockedFunction<typeof fs.readFile>;
  let originalArgv: string[];

  beforeEach(() => {
    reporter = new JSONReporter();
    mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;
    mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
    
    // Mock process.argv
    originalArgv = process.argv;
    process.argv = ['node', 'cleanup.js', '--dry-run', '--verbose'];
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.argv = originalArgv;
  });

  const createMockReport = (): CleanupReport => ({
    summary: {
      totalFiles: 1500,
      totalFindings: 25,
      estimatedSavings: {
        files: 12,
        diskSpace: '2.5 MB',
        dependencies: 8
      }
    },
    categories: {
      'Duplicate File Analyzer': {
        analyzer: 'Duplicate File Analyzer',
        findings: [
          {
            type: 'duplicate',
            files: ['apps/frontend/src/utils/helper.ts', 'packages/shared/src/helper.ts'],
            description: 'Duplicate utility file found',
            recommendation: 'Remove duplicate and update imports',
            autoFixable: true,
            estimatedSavings: { files: 1, size: 2048 }
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
            files: ['apps/backend/package.json'],
            description: 'Unused dependency: lodash',
            recommendation: 'Remove unused dependency',
            autoFixable: false,
            estimatedSavings: { dependencies: 1 }
          }
        ],
        confidence: 'medium',
        riskLevel: 'review'
      }
    },
    recommendations: [
      {
        type: 'duplicate',
        files: ['apps/frontend/src/utils/helper.ts', 'packages/shared/src/helper.ts'],
        description: 'Duplicate utility file found',
        recommendation: 'Remove duplicate and update imports',
        autoFixable: true,
        estimatedSavings: { files: 1, size: 2048 }
      },
      {
        type: 'unused',
        files: ['apps/backend/package.json'],
        description: 'Unused dependency: lodash',
        recommendation: 'Remove unused dependency',
        autoFixable: false,
        estimatedSavings: { dependencies: 1 }
      }
    ]
  });

  describe('canRun', () => {
    it('should always return true', async () => {
      const canRun = await reporter.canRun();
      expect(canRun).toBe(true);
    });
  });

  describe('generateReport', () => {
    it('should generate valid JSON report', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      // Should be valid JSON
      const parsed = JSON.parse(output);
      
      expect(parsed).toHaveProperty('metadata');
      expect(parsed).toHaveProperty('report');
      expect(parsed).toHaveProperty('statistics');
      expect(parsed).toHaveProperty('validation');
    });

    it('should include metadata with timestamp and tool version', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      const parsed = JSON.parse(output);
      
      expect(parsed.metadata).toHaveProperty('generatedAt');
      expect(parsed.metadata).toHaveProperty('toolVersion', '1.0.0');
      expect(parsed.metadata).toHaveProperty('arguments', ['--dry-run', '--verbose']);
      
      // Timestamp should be valid ISO string
      expect(() => new Date(parsed.metadata.generatedAt)).not.toThrow();
    });

    it('should include original report data', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      const parsed = JSON.parse(output);
      
      expect(parsed.report).toEqual(mockReport);
    });

    it('should calculate statistics correctly', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      const parsed = JSON.parse(output);
      
      expect(parsed.statistics.findingsByType).toEqual({
        duplicate: 1,
        unused: 1
      });
      
      expect(parsed.statistics.findingsByRisk).toEqual({
        safe: 1,
        review: 1
      });
      
      expect(parsed.statistics.findingsByConfidence).toEqual({
        high: 1,
        medium: 1
      });
      
      expect(parsed.statistics.autoFixableBreakdown).toEqual({
        autoFixable: 1,
        manual: 1,
        percentage: 50
      });
    });

    it('should calculate workspace distribution', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      const parsed = JSON.parse(output);
      
      expect(parsed.statistics.workspaceDistribution).toEqual({
        frontend: 1,
        shared: 1,
        backend: 1
      });
    });

    it('should validate report data', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      const parsed = JSON.parse(output);
      
      expect(parsed.validation.isValid).toBe(true);
      expect(parsed.validation.errors).toEqual([]);
    });

    it('should write to file when outputPath is provided', async () => {
      const mockReport = createMockReport();
      const outputPath = 'test-report.json';
      
      await reporter.generateReport(mockReport, outputPath);
      
      expect(mockWriteFile).toHaveBeenCalledWith(
        outputPath,
        expect.stringContaining('"metadata"'),
        'utf8'
      );
    });

    it('should handle write errors', async () => {
      const mockReport = createMockReport();
      const outputPath = 'invalid/path/report.json';
      
      mockWriteFile.mockRejectedValue(new Error('Permission denied'));
      
      await expect(
        reporter.generateReport(mockReport, outputPath)
      ).rejects.toThrow('Failed to write JSON report to invalid/path/report.json: Permission denied');
    });
  });

  describe('validation', () => {
    it('should detect negative file counts', async () => {
      const invalidReport: CleanupReport = {
        summary: {
          totalFiles: -1,
          totalFindings: 0,
          estimatedSavings: { files: 0, diskSpace: '0 B', dependencies: 0 }
        },
        categories: {},
        recommendations: []
      };
      
      const output = await reporter.generateReport(invalidReport);
      const parsed = JSON.parse(output);
      
      expect(parsed.validation.isValid).toBe(false);
      expect(parsed.validation.errors).toContain('Total files count cannot be negative');
    });

    it('should detect mismatched finding counts', async () => {
      const invalidReport: CleanupReport = {
        summary: {
          totalFiles: 100,
          totalFindings: 5, // Doesn't match actual findings
          estimatedSavings: { files: 0, diskSpace: '0 B', dependencies: 0 }
        },
        categories: {
          'Test Analyzer': {
            analyzer: 'Test Analyzer',
            findings: [
              {
                type: 'duplicate',
                files: ['test.ts'],
                description: 'Test finding',
                recommendation: 'Test recommendation',
                autoFixable: true
              }
            ],
            confidence: 'high',
            riskLevel: 'safe'
          }
        },
        recommendations: []
      };
      
      const output = await reporter.generateReport(invalidReport);
      const parsed = JSON.parse(output);
      
      expect(parsed.validation.warnings).toContain(
        "Summary total findings (5) doesn't match actual count (1)"
      );
    });

    it('should detect invalid confidence levels', async () => {
      const invalidReport: CleanupReport = {
        summary: {
          totalFiles: 100,
          totalFindings: 1,
          estimatedSavings: { files: 0, diskSpace: '0 B', dependencies: 0 }
        },
        categories: {
          'Test Analyzer': {
            analyzer: 'Test Analyzer',
            findings: [],
            confidence: 'invalid' as any,
            riskLevel: 'safe'
          }
        },
        recommendations: []
      };
      
      const output = await reporter.generateReport(invalidReport);
      const parsed = JSON.parse(output);
      
      expect(parsed.validation.isValid).toBe(false);
      expect(parsed.validation.errors).toContain(
        'Invalid confidence level in Test Analyzer: invalid'
      );
    });
  });

  describe('parseReportFile', () => {
    it('should parse valid JSON report file', async () => {
      const mockReport = createMockReport();
      const jsonOutput = await reporter.generateReport(mockReport);
      
      mockReadFile.mockResolvedValue(jsonOutput);
      
      const parsed = await JSONReporter.parseReportFile('test-report.json');
      
      expect(parsed.report).toEqual(mockReport);
      expect(mockReadFile).toHaveBeenCalledWith('test-report.json', 'utf8');
    });

    it('should handle invalid JSON', async () => {
      mockReadFile.mockResolvedValue('invalid json');
      
      await expect(
        JSONReporter.parseReportFile('invalid.json')
      ).rejects.toThrow('Failed to parse JSON report from invalid.json');
    });

    it('should handle missing required fields', async () => {
      mockReadFile.mockResolvedValue('{"invalid": "structure"}');
      
      await expect(
        JSONReporter.parseReportFile('invalid.json')
      ).rejects.toThrow('Invalid JSON report format: missing required fields');
    });

    it('should handle file read errors', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));
      
      await expect(
        JSONReporter.parseReportFile('missing.json')
      ).rejects.toThrow('Failed to parse JSON report from missing.json: File not found');
    });
  });

  describe('mergeReports', () => {
    it('should merge multiple reports correctly', async () => {
      const report1 = createMockReport();
      const report2: CleanupReport = {
        summary: {
          totalFiles: 500,
          totalFindings: 10,
          estimatedSavings: { files: 5, diskSpace: '1 MB', dependencies: 2 }
        },
        categories: {
          'Another Analyzer': {
            analyzer: 'Another Analyzer',
            findings: [],
            confidence: 'low',
            riskLevel: 'manual'
          }
        },
        recommendations: []
      };
      
      const jsonReport1 = JSON.parse(await reporter.generateReport(report1));
      const jsonReport2 = JSON.parse(await reporter.generateReport(report2));
      
      const merged = JSONReporter.mergeReports([jsonReport1, jsonReport2]);
      
      expect(merged.report.summary.totalFiles).toBe(2000);
      expect(merged.report.summary.totalFindings).toBe(35);
      expect(merged.report.summary.estimatedSavings.files).toBe(17);
      expect(merged.report.summary.estimatedSavings.dependencies).toBe(10);
      
      expect(Object.keys(merged.report.categories)).toContain('Duplicate File Analyzer');
      expect(Object.keys(merged.report.categories)).toContain('Another Analyzer');
    });

    it('should handle single report', async () => {
      const report = createMockReport();
      const jsonReport = JSON.parse(await reporter.generateReport(report));
      
      const merged = JSONReporter.mergeReports([jsonReport]);
      
      expect(merged.report).toEqual(report);
    });

    it('should handle empty reports array', () => {
      expect(() => JSONReporter.mergeReports([])).toThrow('Cannot merge empty reports array');
    });
  });
});