import { 
  Analyzer, 
  AnalysisResult, 
  FileInventory, 
  ProgressInfo, 
  ConfidenceLevel, 
  RiskLevel 
} from '../types';

/**
 * Mock analyzer for testing purposes
 */
export class MockAnalyzer implements Analyzer {
  public readonly name: string;
  public readonly description: string;
  private shouldFail: boolean;
  private executionTime: number;
  private canRunResult: boolean;

  constructor(
    name: string, 
    description: string = `Mock analyzer: ${name}`,
    options: {
      shouldFail?: boolean;
      executionTime?: number;
      canRunResult?: boolean;
    } = {}
  ) {
    this.name = name;
    this.description = description;
    this.shouldFail = options.shouldFail ?? false;
    this.executionTime = options.executionTime ?? 100;
    this.canRunResult = options.canRunResult ?? true;
  }

  async analyze(
    inventory: FileInventory[], 
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<AnalysisResult> {
    // Simulate some work with progress reporting
    const steps = 3;
    
    for (let i = 0; i < steps; i++) {
      if (progressCallback) {
        progressCallback({
          currentStep: `Processing step ${i + 1}`,
          completedSteps: i,
          totalSteps: steps,
          percentage: Math.round((i / steps) * 100),
          details: `Analyzing ${inventory.length} files`
        });
      }
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, this.executionTime / steps));
    }

    if (this.shouldFail) {
      throw new Error(`Mock analyzer ${this.name} failed as configured`);
    }

    // Report completion
    if (progressCallback) {
      progressCallback({
        currentStep: 'Analysis complete',
        completedSteps: steps,
        totalSteps: steps,
        percentage: 100,
        details: `Found ${inventory.length} files`
      });
    }

    return {
      analyzer: this.name,
      findings: [
        {
          type: 'duplicate',
          files: inventory.slice(0, 2).map(f => f.path),
          description: `Mock finding from ${this.name}`,
          recommendation: 'This is a mock recommendation',
          autoFixable: true,
          estimatedSavings: {
            files: 1,
            size: 1024
          }
        }
      ],
      confidence: 'high' as ConfidenceLevel,
      riskLevel: 'safe' as RiskLevel
    };
  }

  async canRun(): Promise<boolean> {
    return this.canRunResult;
  }

  getEstimatedTime(inventorySize: number): number {
    // Simple linear estimation based on inventory size
    return Math.max(this.executionTime, inventorySize * 0.1);
  }
}