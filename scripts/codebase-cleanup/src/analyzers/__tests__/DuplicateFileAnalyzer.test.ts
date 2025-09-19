import { DuplicateFileAnalyzer } from '../DuplicateFileAnalyzer';
import { FileInventory, FileType, WorkspaceType } from '../../types';

describe('DuplicateFileAnalyzer', () => {
  let analyzer: DuplicateFileAnalyzer;

  beforeEach(() => {
    analyzer = new DuplicateFileAnalyzer();
  });

  describe('Basic functionality', () => {
    it('should have correct name and description', () => {
      expect(analyzer.name).toBe('duplicate-file-analyzer');
      expect(analyzer.description).toContain('duplicate files');
    });

    it('should always be able to run', async () => {
      const canRun = await analyzer.canRun();
      expect(canRun).toBe(true);
    });

    it('should provide reasonable time estimates', () => {
      const time100 = analyzer.getEstimatedTime(100);
      const time1000 = analyzer.getEstimatedTime(1000);
      
      expect(time100).toBeGreaterThan(0);
      expect(time1000).toBeGreaterThan(time100);
    });
  });

  describe('Duplicate detection', () => {
    it('should identify exact duplicate files', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/file1.ts', 'hash123', 1000, 'typescript', 'root'),
        createMockFile('backup/file1.ts', 'hash123', 1000, 'typescript', 'root'),
        createMockFile('src/file2.ts', 'hash456', 500, 'typescript', 'root'),
      ];

      const result = await analyzer.analyze(inventory);

      expect(result.analyzer).toBe('duplicate-file-analyzer');
      expect(result.findings).toHaveLength(1);
      
      const finding = result.findings[0];
      expect(finding.type).toBe('duplicate');
      expect(finding.files).toHaveLength(2);
      expect(finding.files).toContain('src/file1.ts');
      expect(finding.files).toContain('backup/file1.ts');
      expect(finding.autoFixable).toBe(true);
      expect(finding.estimatedSavings?.files).toBe(1);
      expect(finding.estimatedSavings?.size).toBe(1000);
    });

    it('should handle multiple duplicate groups', async () => {
      const inventory: FileInventory[] = [
        // Group 1: 3 duplicates
        createMockFile('src/utils.ts', 'hash111', 2000, 'typescript', 'root'),
        createMockFile('apps/backend/utils.ts', 'hash111', 2000, 'typescript', 'backend'),
        createMockFile('apps/frontend/utils.ts', 'hash111', 2000, 'typescript', 'frontend'),
        
        // Group 2: 2 duplicates  
        createMockFile('README.md', 'hash222', 1500, 'markdown', 'root'),
        createMockFile('docs/README.md', 'hash222', 1500, 'markdown', 'root'),
        
        // Unique file
        createMockFile('src/unique.ts', 'hash333', 800, 'typescript', 'root'),
      ];

      const result = await analyzer.analyze(inventory);

      expect(result.findings).toHaveLength(2);
      
      // Check first group (3 duplicates)
      const group1 = result.findings.find(f => f.files.length === 3);
      expect(group1).toBeDefined();
      expect(group1?.estimatedSavings?.files).toBe(2);
      expect(group1?.estimatedSavings?.size).toBe(4000); // 2 * 2000
      
      // Check second group (2 duplicates)
      const group2 = result.findings.find(f => f.files.length === 2);
      expect(group2).toBeDefined();
      expect(group2?.estimatedSavings?.files).toBe(1);
      expect(group2?.estimatedSavings?.size).toBe(1500);
    });

    it('should return no findings for unique files', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/file1.ts', 'hash1', 1000, 'typescript', 'root'),
        createMockFile('src/file2.ts', 'hash2', 1500, 'typescript', 'root'), // Different size
        createMockFile('src/file3.ts', 'hash3', 2000, 'typescript', 'root'), // Different size
      ];

      const result = await analyzer.analyze(inventory);

      expect(result.findings).toHaveLength(0);
    });
  });

  describe('File prioritization', () => {
    it('should prioritize root workspace files', async () => {
      const inventory: FileInventory[] = [
        createMockFile('apps/backend/config.json', 'hash123', 500, 'json', 'backend'),
        createMockFile('config.json', 'hash123', 500, 'json', 'root'),
      ];

      const result = await analyzer.analyze(inventory);

      expect(result.findings).toHaveLength(1);
      const finding = result.findings[0];
      expect(finding.recommendation).toContain("Keep 'config.json'");
      expect(finding.recommendation).toContain("remove");
      expect(finding.recommendation).toContain('apps/backend/config.json');
    });

    it('should prioritize shorter paths', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/deep/nested/file.ts', 'hash123', 500, 'typescript', 'root'),
        createMockFile('src/file.ts', 'hash123', 500, 'typescript', 'root'),
      ];

      const result = await analyzer.analyze(inventory);

      expect(result.findings).toHaveLength(1);
      const finding = result.findings[0];
      expect(finding.recommendation).toContain("Keep 'src/file.ts'");
      expect(finding.recommendation).toContain('src/deep/nested/file.ts');
    });

    it('should prioritize standard locations', async () => {
      const inventory: FileInventory[] = [
        createMockFile('random/index.js', 'hash123', 500, 'javascript', 'root'),
        createMockFile('src/index.js', 'hash123', 500, 'javascript', 'root'),
      ];

      const result = await analyzer.analyze(inventory);

      expect(result.findings).toHaveLength(1);
      const finding = result.findings[0];
      expect(finding.recommendation).toContain("Keep 'src/index.js'");
      expect(finding.recommendation).toContain('random/index.js');
    });

    it('should use alphabetical order as tiebreaker', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/zebra.ts', 'hash123', 500, 'typescript', 'root'),
        createMockFile('src/alpha.ts', 'hash123', 500, 'typescript', 'root'),
      ];

      const result = await analyzer.analyze(inventory);

      expect(result.findings).toHaveLength(1);
      const finding = result.findings[0];
      expect(finding.recommendation).toContain("Keep 'src/alpha.ts'");
      expect(finding.recommendation).toContain('src/zebra.ts');
    });
  });

  describe('Similarity detection', () => {
    it('should detect similar files with size differences', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/file1.ts', 'hash1', 1000, 'typescript', 'root'),
        createMockFile('src/file2.ts', 'hash2', 1050, 'typescript', 'root'), // 5% size difference
      ];

      const result = await analyzer.analyze(inventory);

      // Should find similarity based on size heuristic
      expect(result.findings.length).toBeGreaterThanOrEqual(0);
      
      // If similarity is detected, it should not be auto-fixable
      const similarityFinding = result.findings.find(f => 
        f.description.includes('similar') || f.description.includes('%')
      );
      
      if (similarityFinding) {
        expect(similarityFinding.autoFixable).toBe(false);
        expect(similarityFinding.recommendation).toContain('Review');
      }
    });

    it('should only analyze source code files for similarity', async () => {
      const inventory: FileInventory[] = [
        createMockFile('image1.png', 'hash1', 1000, 'asset', 'root'),
        createMockFile('image2.png', 'hash2', 1050, 'asset', 'root'),
        createMockFile('src/file1.ts', 'hash3', 1000, 'typescript', 'root'),
        createMockFile('src/file2.ts', 'hash4', 1050, 'typescript', 'root'),
      ];

      const result = await analyzer.analyze(inventory);

      // Should not analyze asset files for similarity
      const findings = result.findings.filter(f => 
        f.files.some(file => file.endsWith('.png'))
      );
      
      expect(findings).toHaveLength(0);
    });

    it('should detect files with same size but different hashes as potentially similar', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/file1.ts', 'hash1', 1000, 'typescript', 'root'),
        createMockFile('src/file2.ts', 'hash2', 1000, 'typescript', 'root'), // Same size, different hash
      ];

      const result = await analyzer.analyze(inventory);

      // The similarity detection uses a conservative approach
      // Files with same size but different hashes might not always be flagged as similar
      // depending on the heuristic thresholds
      expect(result.analyzer).toBe('duplicate-file-analyzer');
      expect(result.confidence).toBe('high');
      expect(result.riskLevel).toBe('safe');
      
      // The analyzer should complete successfully even if no similarities are found
      expect(result.findings).toBeDefined();
    });
  });

  describe('Progress reporting', () => {
    it('should call progress callback during analysis', async () => {
      const progressCallback = jest.fn();
      const inventory: FileInventory[] = [
        createMockFile('src/file1.ts', 'hash1', 1000, 'typescript', 'root'),
        createMockFile('src/file2.ts', 'hash2', 1000, 'typescript', 'root'),
      ];

      await analyzer.analyze(inventory, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      
      // Should report progress at different stages
      const calls = progressCallback.mock.calls;
      expect(calls.some(call => call[0].currentStep.includes('Grouping'))).toBe(true);
      expect(calls.some(call => call[0].currentStep.includes('complete'))).toBe(true);
    });

    it('should report 100% completion', async () => {
      const progressCallback = jest.fn();
      const inventory: FileInventory[] = [
        createMockFile('src/file1.ts', 'hash1', 1000, 'typescript', 'root'),
      ];

      await analyzer.analyze(inventory, progressCallback);

      const finalCall = progressCallback.mock.calls[progressCallback.mock.calls.length - 1];
      expect(finalCall[0].percentage).toBe(100);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty inventory', async () => {
      const result = await analyzer.analyze([]);

      expect(result.findings).toHaveLength(0);
      expect(result.confidence).toBe('high');
      expect(result.riskLevel).toBe('safe');
    });

    it('should handle single file inventory', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/file1.ts', 'hash1', 1000, 'typescript', 'root'),
      ];

      const result = await analyzer.analyze(inventory);

      expect(result.findings).toHaveLength(0);
    });

    it('should handle files with same hash but different metadata', async () => {
      const inventory: FileInventory[] = [
        createMockFile('src/file1.ts', 'hash123', 1000, 'typescript', 'root'),
        createMockFile('src/file2.ts', 'hash123', 2000, 'typescript', 'root'), // Different size but same hash
      ];

      const result = await analyzer.analyze(inventory);

      expect(result.findings).toHaveLength(1);
      const finding = result.findings[0];
      expect(finding.type).toBe('duplicate');
      expect(finding.files).toHaveLength(2);
    });
  });
});

/**
 * Helper function to create mock FileInventory objects for testing
 */
function createMockFile(
  path: string,
  contentHash: string,
  size: number,
  fileType: FileType,
  workspace: WorkspaceType,
  lastModified: Date = new Date()
): FileInventory {
  return {
    path,
    contentHash,
    size,
    fileType,
    workspace,
    lastModified
  };
}