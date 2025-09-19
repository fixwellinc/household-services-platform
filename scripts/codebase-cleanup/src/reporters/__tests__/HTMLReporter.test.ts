/**
 * Tests for HTMLReporter
 */

import { promises as fs } from 'fs';
import { HTMLReporter } from '../HTMLReporter';
import { CleanupReport } from '../../types';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn()
  }
}));

describe('HTMLReporter', () => {
  let reporter: HTMLReporter;
  let mockWriteFile: jest.MockedFunction<typeof fs.writeFile>;

  beforeEach(() => {
    reporter = new HTMLReporter();
    mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;
  });

  afterEach(() => {
    jest.clearAllMocks();
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
    it('should generate valid HTML document', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('<!DOCTYPE html>');
      expect(output).toContain('<html lang="en">');
      expect(output).toContain('<head>');
      expect(output).toContain('<body>');
      expect(output).toContain('</html>');
    });

    it('should include proper HTML structure and metadata', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('<meta charset="UTF-8">');
      expect(output).toContain('<meta name="viewport"');
      expect(output).toContain('<title>Codebase Cleanup Report</title>');
    });

    it('should include CSS styles', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('<style>');
      expect(output).toContain('font-family:');
      expect(output).toContain('.container');
      expect(output).toContain('.summary-grid');
      expect(output).toContain('.section');
    });

    it('should include JavaScript functionality', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('<script>');
      expect(output).toContain('addEventListener');
      expect(output).toContain('category-header');
    });

    it('should include report header with title and timestamp', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('🧹 Codebase Cleanup Report');
      expect(output).toContain('Generated on');
    });

    it('should display summary statistics', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('1,500'); // Total files
      expect(output).toContain('25'); // Total findings
      expect(output).toContain('12'); // Files to remove
      expect(output).toContain('2.5 MB'); // Disk space
      expect(output).toContain('8'); // Dependencies
    });

    it('should include analysis categories section', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('Analysis Categories');
      expect(output).toContain('Duplicate File Analyzer');
      expect(output).toContain('Dependency Analyzer');
      expect(output).toContain('Risk: safe');
      expect(output).toContain('Risk: review');
      expect(output).toContain('Confidence: high');
      expect(output).toContain('Confidence: medium');
    });

    it('should display findings with proper formatting', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('Duplicate utility file found');
      expect(output).toContain('Remove duplicate and update imports');
      expect(output).toContain('src/utils/helper.ts');
      expect(output).toContain('src/shared/helper.ts');
      expect(output).toContain('🔧 Auto-fix');
      expect(output).toContain('👤 Manual');
    });

    it('should include recommendations section', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('Top Recommendations');
      expect(output).toContain('finding-duplicate');
      expect(output).toContain('finding-unused');
    });

    it('should show estimated savings for findings', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('📁 1 files');
      expect(output).toContain('💾 2.0 KB');
      expect(output).toContain('📦 1 deps');
    });

    it('should handle empty report gracefully', async () => {
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
      
      expect(output).toContain('100'); // Total files
      expect(output).toContain('0'); // No findings
      expect(output).toContain('No recommendations available');
    });

    it('should write to file when outputPath is provided', async () => {
      const mockReport = createMockReport();
      const outputPath = 'test-report.html';
      
      await reporter.generateReport(mockReport, outputPath);
      
      expect(mockWriteFile).toHaveBeenCalledWith(
        outputPath,
        expect.stringContaining('<!DOCTYPE html>'),
        'utf8'
      );
    });

    it('should handle write errors', async () => {
      const mockReport = createMockReport();
      const outputPath = 'invalid/path/report.html';
      
      mockWriteFile.mockRejectedValue(new Error('Permission denied'));
      
      await expect(
        reporter.generateReport(mockReport, outputPath)
      ).rejects.toThrow('Failed to write HTML report to invalid/path/report.html: Permission denied');
    });
  });

  describe('HTML structure validation', () => {
    it('should have proper CSS classes for styling', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      // Check for key CSS classes
      expect(output).toContain('class="container"');
      expect(output).toContain('class="summary-grid"');
      expect(output).toContain('class="summary-card"');
      expect(output).toContain('class="section"');
      expect(output).toContain('class="category-item"');
      expect(output).toContain('finding-item');
    });

    it('should include interactive elements', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('category-header');
      expect(output).toContain('toggle-icon');
      expect(output).toContain('category-content');
    });

    it('should have proper risk level styling', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('risk-safe');
      expect(output).toContain('risk-review');
      expect(output).toContain('confidence-high');
      expect(output).toContain('confidence-medium');
    });

    it('should include file lists with proper formatting', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('file-list');
      expect(output).toContain('file-item');
      expect(output).toContain('Affected files:');
    });

    it('should escape HTML in user content', async () => {
      const reportWithHtml: CleanupReport = {
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
                files: ['<script>alert("xss")</script>'],
                description: 'Test <script>alert("xss")</script>',
                recommendation: 'Fix <b>this</b>',
                autoFixable: true
              }
            ],
            confidence: 'high',
            riskLevel: 'safe'
          }
        },
        recommendations: []
      };
      
      const output = await reporter.generateReport(reportWithHtml);
      
      // Should not contain unescaped script tags
      expect(output).not.toContain('<script>alert("xss")</script>');
      // Should contain escaped content (this is a simplified check)
      expect(output).toContain('&lt;script&gt;');
    });
  });

  describe('responsive design', () => {
    it('should include mobile-responsive CSS', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('@media (max-width: 768px)');
      expect(output).toContain('grid-template-columns: 1fr');
    });
  });

  describe('accessibility', () => {
    it('should include proper semantic HTML', async () => {
      const mockReport = createMockReport();
      
      const output = await reporter.generateReport(mockReport);
      
      expect(output).toContain('lang="en"');
      expect(output).toContain('<h1>');
      expect(output).toContain('<h3>');
    });
  });
});