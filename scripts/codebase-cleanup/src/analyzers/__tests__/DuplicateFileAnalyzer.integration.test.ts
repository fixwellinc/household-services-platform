import * as path from 'path';
import * as fs from 'fs';
import { DuplicateFileAnalyzer } from '../DuplicateFileAnalyzer';
import { FileScanner } from '../../core/FileScanner';

describe('DuplicateFileAnalyzer Integration Tests', () => {
  let analyzer: DuplicateFileAnalyzer;
  let fixturesPath: string;

  beforeEach(() => {
    analyzer = new DuplicateFileAnalyzer();
    fixturesPath = path.join(__dirname, 'test-data');
  });

  it('should detect duplicate files in real file system', async () => {
    // Ensure fixtures directory exists
    if (!fs.existsSync(fixturesPath)) {
      console.warn('Fixtures directory not found, skipping integration test');
      return;
    }

    // Scan the fixtures directory
    const scanner = new FileScanner(fixturesPath);
    const inventory = await scanner.scanRepository();

    // Analyze for duplicates
    const result = await analyzer.analyze(inventory);

    // Should find the duplicate files we created
    expect(result.analyzer).toBe('duplicate-file-analyzer');
    expect(result.confidence).toBe('high');
    expect(result.riskLevel).toBe('safe');

    // Check if duplicates were found
    const duplicateFindings = result.findings.filter(f => f.type === 'duplicate');
    
    if (duplicateFindings.length > 0) {
      const finding = duplicateFindings[0];
      expect(finding.files.length).toBeGreaterThanOrEqual(2);
      expect(finding.autoFixable).toBe(true);
      expect(finding.estimatedSavings?.files).toBeGreaterThan(0);
      
      console.log('Found duplicate files:', finding.files);
      console.log('Recommendation:', finding.recommendation);
    }
  });

  it('should provide progress updates during analysis', async () => {
    if (!fs.existsSync(fixturesPath)) {
      console.warn('Fixtures directory not found, skipping integration test');
      return;
    }

    const scanner = new FileScanner(fixturesPath);
    const inventory = await scanner.scanRepository();

    const progressUpdates: string[] = [];
    const progressCallback = (progress: any) => {
      progressUpdates.push(progress.currentStep);
    };

    await analyzer.analyze(inventory, progressCallback);

    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates).toContain('Grouping files by content hash');
    expect(progressUpdates).toContain('Analysis complete');
  });

  it('should handle empty directory gracefully', async () => {
    const emptyDirPath = path.join(__dirname, 'empty-test-dir');
    
    // Create empty directory for testing
    if (!fs.existsSync(emptyDirPath)) {
      fs.mkdirSync(emptyDirPath, { recursive: true });
    }

    try {
      const scanner = new FileScanner(emptyDirPath);
      const inventory = await scanner.scanRepository();
      
      const result = await analyzer.analyze(inventory);
      
      expect(result.findings).toHaveLength(0);
      expect(result.confidence).toBe('high');
    } finally {
      // Clean up
      if (fs.existsSync(emptyDirPath)) {
        fs.rmSync(emptyDirPath, { recursive: true, force: true });
      }
    }
  });
});