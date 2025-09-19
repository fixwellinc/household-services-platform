/**
 * Tests for ConsoleReporter
 */

import { ConsoleReporter } from '../ConsoleReporter';
import { CleanupReport } from '../../types';

describe('ConsoleReporter', () => {
  let reporter: ConsoleReporter;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    reporter = new ConsoleReporter();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
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
            files: ['src/utils/helper.ts', 'src/shared/helper.ts'],
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
            files: ['package.json'],
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
        files: ['src/utils/helper.ts', 'src/shared/helper.ts'],
        description: 'Duplicate utility file found',
        recommendation: 'Remove duplicate and update imports',
        autoFixable: true,
        estimatedSavings: { files: 1, size: 2048 }
      },
      {
        type: 'unused',
        files: ['package.json'],
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
    it('should generate a complete console report', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('CODEBASE CLEANUP REPORT');
      expect(output).toContain('SUMMARY');
      expect(output).toContain('Files Analyzed:');
      expect(output).toContain('1,500');
      expect(output).toContain('Issues Found:');
      expect(output).toContain('25');
      expect(output).toContain('ANALYSIS BREAKDOWN');
      expect(output).toContain('TOP RECOMMENDATIONS');
      expect(output).toContain('NEXT STEPS');
      
      expect(consoleSpy).toHaveBeenCalledWith(output);
    });

    it('should handle empty report', async () => {
      const emptyReport: CleanupReport = {
        summary: {
          totalFiles: 100,
          totalFindings: 0,
          estimatedSavings: {
            files: 0,
            diskSpace: '0 B',
            dependencies: 0
          }
        },
        categories: {},
        recommendations: []
      };
      
      const output = await reporter.generateReport(emptyReport);
      
      expect(output).toContain('No issues found! Your codebase is clean.');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should include color codes in output', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      // Check for ANSI color codes
      expect(output).toMatch(/\x1b\[\d+m/); // Contains color codes
      expect(output).toContain('\x1b[0m'); // Contains reset codes
    });

    it('should show auto-fixable vs manual breakdown', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('1 issues can be automatically fixed');
      expect(output).toContain('1 issues require manual review');
    });

    it('should display estimated savings', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('Files to remove:');
      expect(output).toContain('12');
      expect(output).toContain('Disk space:');
      expect(output).toContain('2.5 MB');
      expect(output).toContain('Dependencies:');
      expect(output).toContain('8');
    });
  });

  describe('createProgressBar', () => {
    it('should create progress bar with correct format', () => {
      const progressBar = ConsoleReporter.createProgressBar(25, 100, 20);
      
      expect(progressBar).toContain('[');
      expect(progressBar).toContain(']');
      expect(progressBar).toContain('25.0%');
      expect(progressBar).toContain('(25/100)');
    });

    it('should handle edge cases', () => {
      // 0% progress
      const zeroProgress = ConsoleReporter.createProgressBar(0, 100, 10);
      expect(zeroProgress).toContain('0.0%');
      expect(zeroProgress).toContain('░'.repeat(10));
      
      // 100% progress
      const fullProgress = ConsoleReporter.createProgressBar(100, 100, 10);
      expect(fullProgress).toContain('100.0%');
      expect(fullProgress).toContain('█'.repeat(10));
      
      // Over 100%
      const overProgress = ConsoleReporter.createProgressBar(150, 100, 10);
      expect(overProgress).toContain('100.0%');
    });

    it('should handle zero total', () => {
      const progressBar = ConsoleReporter.createProgressBar(5, 0, 10);
      expect(progressBar).toContain('0.0%');
    });
  });

  describe('displayProgress', () => {
    let stdoutSpy: jest.SpyInstance;

    beforeEach(() => {
      stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    });

    afterEach(() => {
      stdoutSpy.mockRestore();
    });

    it('should display progress with spinner', () => {
      ConsoleReporter.displayProgress('Analyzing files', 50, 100);
      
      expect(stdoutSpy).toHaveBeenCalled();
      const output = stdoutSpy.mock.calls[0][0] as string;
      
      expect(output).toContain('Analyzing files');
      expect(output).toContain('50.0%');
      expect(output).toContain('(50/100)');
      expect(output).toMatch(/[⠋⠙⠹⠸⠼⠴⠦⠧]/); // Spinner character
    });

    it('should add newline when complete', () => {
      ConsoleReporter.displayProgress('Complete', 100, 100);
      
      expect(stdoutSpy).toHaveBeenCalledTimes(2);
      expect(stdoutSpy.mock.calls[1][0]).toBe('\n');
    });
  });

  describe('report sections', () => {
    it('should format category breakdown correctly', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('Duplicate File Analyzer');
      expect(output).toContain('Confidence: high');
      expect(output).toContain('Risk: safe');
      expect(output).toContain('1 finding');
      expect(output).toContain('📋 1 duplicate issue');
    });

    it('should show top recommendations with priorities', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('Duplicate utility file found');
      expect(output).toContain('Remove duplicate and update imports');
      expect(output).toContain('Auto-fixable');
      expect(output).toContain('Unused dependency: lodash');
      expect(output).toContain('Manual review required');
    });

    it('should include next steps section', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('NEXT STEPS');
      expect(output).toContain('--auto-fix');
      expect(output).toContain('--interactive');
      expect(output).toContain('--output-json');
      expect(output).toContain('--output-html');
    });
  });
});