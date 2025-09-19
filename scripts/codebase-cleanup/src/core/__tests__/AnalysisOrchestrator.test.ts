import { AnalysisOrchestrator } from '../AnalysisOrchestrator';
import { MockAnalyzer } from '../MockAnalyzer';
import { FileInventory, ProgressInfo } from '../../types';

describe('AnalysisOrchestrator', () => {
  let orchestrator: AnalysisOrchestrator;
  let progressUpdates: ProgressInfo[];
  let mockInventory: FileInventory[];

  beforeEach(() => {
    progressUpdates = [];
    orchestrator = new AnalysisOrchestrator((progress) => {
      progressUpdates.push(progress);
    });

    // Create mock file inventory
    mockInventory = [
      {
        path: 'src/file1.ts',
        size: 1024,
        lastModified: new Date(),
        contentHash: 'hash1',
        fileType: 'typescript',
        workspace: 'frontend'
      },
      {
        path: 'src/file2.ts',
        size: 2048,
        lastModified: new Date(),
        contentHash: 'hash2',
        fileType: 'typescript',
        workspace: 'backend'
      }
    ];
  });

  describe('Analyzer Registration', () => {
    it('should register a single analyzer', () => {
      const analyzer = new MockAnalyzer('test-analyzer');
      orchestrator.registerAnalyzer(analyzer);
      
      expect(orchestrator.getRegisteredAnalyzers()).toEqual(['test-analyzer']);
    });

    it('should register multiple analyzers', () => {
      const analyzers = [
        new MockAnalyzer('analyzer1'),
        new MockAnalyzer('analyzer2'),
        new MockAnalyzer('analyzer3')
      ];
      
      orchestrator.registerAnalyzers(analyzers);
      
      expect(orchestrator.getRegisteredAnalyzers()).toEqual([
        'analyzer1', 'analyzer2', 'analyzer3'
      ]);
    });

    it('should throw error when registering analyzer with duplicate name', () => {
      const analyzer1 = new MockAnalyzer('duplicate-name');
      const analyzer2 = new MockAnalyzer('duplicate-name');
      
      orchestrator.registerAnalyzer(analyzer1);
      
      expect(() => orchestrator.registerAnalyzer(analyzer2))
        .toThrow("Analyzer with name 'duplicate-name' is already registered");
    });

    it('should unregister analyzer by name', () => {
      const analyzer = new MockAnalyzer('test-analyzer');
      orchestrator.registerAnalyzer(analyzer);
      
      const removed = orchestrator.unregisterAnalyzer('test-analyzer');
      
      expect(removed).toBe(true);
      expect(orchestrator.getRegisteredAnalyzers()).toEqual([]);
    });

    it('should return false when unregistering non-existent analyzer', () => {
      const removed = orchestrator.unregisterAnalyzer('non-existent');
      expect(removed).toBe(false);
    });

    it('should clear all analyzers', () => {
      orchestrator.registerAnalyzers([
        new MockAnalyzer('analyzer1'),
        new MockAnalyzer('analyzer2')
      ]);
      
      orchestrator.clearAnalyzers();
      
      expect(orchestrator.getRegisteredAnalyzers()).toEqual([]);
    });
  });

  describe('Analysis Execution', () => {
    it('should execute single analyzer successfully', async () => {
      const analyzer = new MockAnalyzer('test-analyzer');
      orchestrator.registerAnalyzer(analyzer);
      
      const result = await orchestrator.executeAnalysis(mockInventory);
      
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].analyzer).toBe('test-analyzer');
      expect(result.errors).toHaveLength(0);
      expect(result.totalTime).toBeGreaterThan(0);
    });

    it('should execute multiple analyzers in sequence', async () => {
      const analyzers = [
        new MockAnalyzer('analyzer1'),
        new MockAnalyzer('analyzer2'),
        new MockAnalyzer('analyzer3')
      ];
      
      orchestrator.registerAnalyzers(analyzers);
      
      const result = await orchestrator.executeAnalysis(mockInventory);
      
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.results.map(r => r.analyzer)).toEqual([
        'analyzer1', 'analyzer2', 'analyzer3'
      ]);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle analyzer failures gracefully', async () => {
      const analyzers = [
        new MockAnalyzer('good-analyzer'),
        new MockAnalyzer('failing-analyzer', 'Failing analyzer', { shouldFail: true }),
        new MockAnalyzer('another-good-analyzer')
      ];
      
      orchestrator.registerAnalyzers(analyzers);
      
      const result = await orchestrator.executeAnalysis(mockInventory);
      
      expect(result.success).toBe(true); // Should still be successful as error is recoverable
      expect(result.results).toHaveLength(2); // Only successful analyzers
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].analyzerName).toBe('failing-analyzer');
      expect(result.errors[0].recoverable).toBe(true);
    });

    it('should stop execution on critical errors', async () => {
      const criticalAnalyzer = new MockAnalyzer('critical-analyzer');
      // Mock a critical error by overriding the analyze method
      criticalAnalyzer.analyze = jest.fn().mockRejectedValue(
        Object.assign(new Error('Critical error'), { code: 'ENOMEM' })
      );
      
      const analyzers = [
        new MockAnalyzer('good-analyzer'),
        criticalAnalyzer,
        new MockAnalyzer('never-reached-analyzer')
      ];
      
      orchestrator.registerAnalyzers(analyzers);
      
      const result = await orchestrator.executeAnalysis(mockInventory);
      
      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(1); // Only the first analyzer
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].recoverable).toBe(false);
    });

    it('should fail validation if analyzer cannot run', async () => {
      const analyzer = new MockAnalyzer('invalid-analyzer', 'Invalid analyzer', {
        canRunResult: false
      });
      
      orchestrator.registerAnalyzer(analyzer);
      
      const result = await orchestrator.executeAnalysis(mockInventory);
      
      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].analyzerName).toBe('invalid-analyzer');
      expect(result.errors[0].recoverable).toBe(false);
    });
  });

  describe('Progress Reporting', () => {
    it('should report progress during execution', async () => {
      const analyzer = new MockAnalyzer('test-analyzer');
      orchestrator.registerAnalyzer(analyzer);
      
      await orchestrator.executeAnalysis(mockInventory);
      
      expect(progressUpdates.length).toBeGreaterThan(0);
      
      // Check that we have start, progress, and completion updates
      const startUpdate = progressUpdates.find(p => p.currentStep.includes('Starting'));
      const completionUpdate = progressUpdates.find(p => p.currentStep.includes('complete'));
      
      expect(startUpdate).toBeDefined();
      expect(completionUpdate).toBeDefined();
      
      // The final update should have 100% progress
      const finalUpdate = progressUpdates[progressUpdates.length - 1];
      expect(finalUpdate.percentage).toBe(100);
    });

    it('should include analyzer-specific progress updates', async () => {
      const analyzer = new MockAnalyzer('test-analyzer');
      orchestrator.registerAnalyzer(analyzer);
      
      await orchestrator.executeAnalysis(mockInventory);
      
      // Should have progress updates that include the analyzer name
      const analyzerUpdates = progressUpdates.filter(p => 
        p.currentStep.includes('test-analyzer')
      );
      
      expect(analyzerUpdates.length).toBeGreaterThan(0);
    });

    it('should work without progress callback', async () => {
      const orchestratorWithoutCallback = new AnalysisOrchestrator();
      const analyzer = new MockAnalyzer('test-analyzer');
      orchestratorWithoutCallback.registerAnalyzer(analyzer);
      
      // Should not throw error
      const result = await orchestratorWithoutCallback.executeAnalysis(mockInventory);
      expect(result.success).toBe(true);
    });
  });

  describe('Utility Methods', () => {
    it('should calculate estimated total time', () => {
      const analyzers = [
        new MockAnalyzer('analyzer1', 'Analyzer 1', { executionTime: 100 }),
        new MockAnalyzer('analyzer2', 'Analyzer 2', { executionTime: 200 }),
        new MockAnalyzer('analyzer3', 'Analyzer 3', { executionTime: 300 })
      ];
      
      orchestrator.registerAnalyzers(analyzers);
      
      const estimatedTime = orchestrator.getEstimatedTotalTime(1000);
      
      // Should be at least the sum of base execution times
      expect(estimatedTime).toBeGreaterThanOrEqual(600);
    });

    it('should return analyzer information', () => {
      const analyzers = [
        new MockAnalyzer('analyzer1', 'First analyzer'),
        new MockAnalyzer('analyzer2', 'Second analyzer')
      ];
      
      orchestrator.registerAnalyzers(analyzers);
      
      const info = orchestrator.getAnalyzerInfo();
      
      expect(info).toEqual([
        { name: 'analyzer1', description: 'First analyzer' },
        { name: 'analyzer2', description: 'Second analyzer' }
      ]);
    });
  });

  describe('Error Handling', () => {
    it('should handle analyzer validation errors', async () => {
      const analyzer = new MockAnalyzer('test-analyzer');
      // Mock canRun to throw an error
      analyzer.canRun = jest.fn().mockRejectedValue(new Error('Validation failed'));
      
      orchestrator.registerAnalyzer(analyzer);
      
      const result = await orchestrator.executeAnalysis(mockInventory);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Validation failed');
    });

    it('should identify recoverable vs non-recoverable errors', async () => {
      const recoverableAnalyzer = new MockAnalyzer('recoverable');
      recoverableAnalyzer.analyze = jest.fn().mockRejectedValue(
        new Error('Regular error')
      );
      
      const nonRecoverableAnalyzer = new MockAnalyzer('non-recoverable');
      nonRecoverableAnalyzer.analyze = jest.fn().mockRejectedValue(
        Object.assign(new Error('Memory error'), { code: 'ENOMEM' })
      );
      
      orchestrator.registerAnalyzers([recoverableAnalyzer, nonRecoverableAnalyzer]);
      
      const result = await orchestrator.executeAnalysis(mockInventory);
      
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].recoverable).toBe(true);
      expect(result.errors[1].recoverable).toBe(false);
    });
  });
});