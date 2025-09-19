import { 
  Analyzer, 
  AnalysisResult, 
  AnalyzerError, 
  FileInventory, 
  OrchestrationResult, 
  ProgressInfo 
} from '../types';
import { PerformanceOptimizer, PerformanceConfig } from './PerformanceOptimizer';

/**
 * Orchestrates the execution of multiple analyzers in a coordinated manner.
 * Handles progress reporting, error management, and analyzer dependencies.
 */
export class AnalysisOrchestrator {
  private analyzers: Analyzer[] = [];
  private progressCallback?: (progress: ProgressInfo) => void;
  private totalSteps = 0;
  private completedSteps = 0;
  private performanceOptimizer: PerformanceOptimizer;

  constructor(
    progressCallback?: (progress: ProgressInfo) => void,
    performanceConfig?: PerformanceConfig
  ) {
    this.progressCallback = progressCallback;
    this.performanceOptimizer = new PerformanceOptimizer(performanceConfig);
  }

  /**
   * Register an analyzer to be executed during orchestration
   * @param analyzer - The analyzer to register
   */
  registerAnalyzer(analyzer: Analyzer): void {
    if (this.analyzers.some(a => a.name === analyzer.name)) {
      throw new Error(`Analyzer with name '${analyzer.name}' is already registered`);
    }
    this.analyzers.push(analyzer);
  }

  /**
   * Register multiple analyzers at once
   * @param analyzers - Array of analyzers to register
   */
  registerAnalyzers(analyzers: Analyzer[]): void {
    analyzers.forEach(analyzer => this.registerAnalyzer(analyzer));
  }

  /**
   * Remove an analyzer from the orchestration
   * @param analyzerName - Name of the analyzer to remove
   * @returns True if analyzer was found and removed, false otherwise
   */
  unregisterAnalyzer(analyzerName: string): boolean {
    const initialLength = this.analyzers.length;
    this.analyzers = this.analyzers.filter(a => a.name !== analyzerName);
    return this.analyzers.length < initialLength;
  }

  /**
   * Get list of registered analyzer names
   * @returns Array of analyzer names
   */
  getRegisteredAnalyzers(): string[] {
    return this.analyzers.map(a => a.name);
  }

  /**
   * Execute all registered analyzers on the provided file inventory
   * @param inventory - File inventory to analyze
   * @param useOptimization - Whether to use performance optimization (default: true)
   * @returns Promise resolving to orchestration results
   */
  async executeAnalysis(
    inventory: FileInventory[], 
    useOptimization: boolean = true
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    let results: AnalysisResult[] = [];
    const errors: AnalyzerError[] = [];

    // Validate all analyzers can run before starting
    const validationResults = await this.validateAnalyzers();
    if (validationResults.length > 0) {
      return {
        results: [],
        errors: validationResults,
        totalTime: Date.now() - startTime,
        success: false
      };
    }

    // Calculate total steps for progress reporting
    this.totalSteps = this.analyzers.length;
    this.completedSteps = 0;

    this.reportProgress('Starting analysis orchestration', 0);

    try {
      if (useOptimization && this.analyzers.length > 1) {
        // Use performance optimizer for parallel execution and incremental analysis
        results = await this.performanceOptimizer.optimizeAnalysis(
          this.analyzers,
          inventory,
          this.progressCallback
        );
      } else {
        // Execute analyzers sequentially (legacy mode)
        results = await this.executeSequential(inventory);
      }
    } catch (error) {
      const orchestrationError: AnalyzerError = {
        analyzerName: 'orchestrator',
        message: error instanceof Error ? error.message : 'Unknown orchestration error',
        originalError: error instanceof Error ? error : undefined,
        recoverable: false
      };
      errors.push(orchestrationError);
    }

    const totalTime = Date.now() - startTime;
    const success = errors.length === 0 || errors.every(e => e.recoverable);

    this.reportProgress('Analysis orchestration complete', 100);

    return {
      results,
      errors,
      totalTime,
      success
    };
  }

  /**
   * Execute analyzers sequentially (legacy mode)
   */
  private async executeSequential(inventory: FileInventory[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    for (const analyzer of this.analyzers) {
      try {
        this.reportProgress(`Running ${analyzer.name}`, this.getProgressPercentage());
        
        const result = await this.executeAnalyzer(analyzer, inventory);
        results.push(result);
        
        this.completedSteps++;
        this.reportProgress(`Completed ${analyzer.name}`, this.getProgressPercentage());
        
      } catch (error) {
        // In sequential mode, we continue with other analyzers on error
        console.warn(`Error in ${analyzer.name}: ${error}`);
        this.completedSteps++;
      }
    }

    return results;
  }

  /**
   * Execute a single analyzer with proper error handling and progress reporting
   * @param analyzer - The analyzer to execute
   * @param inventory - File inventory to analyze
   * @returns Promise resolving to analysis result
   */
  private async executeAnalyzer(analyzer: Analyzer, inventory: FileInventory[]): Promise<AnalysisResult> {
    const analyzerProgressCallback = (progress: ProgressInfo) => {
      // Adjust progress to account for this analyzer's position in the overall orchestration
      const overallProgress: ProgressInfo = {
        currentStep: `${analyzer.name}: ${progress.currentStep}`,
        completedSteps: this.completedSteps,
        totalSteps: this.totalSteps,
        percentage: this.getProgressPercentage(),
        details: progress.details
      };
      
      if (this.progressCallback) {
        this.progressCallback(overallProgress);
      }
    };

    return await analyzer.analyze(inventory, analyzerProgressCallback);
  }

  /**
   * Validate that all registered analyzers can run
   * @returns Array of validation errors (empty if all analyzers are valid)
   */
  private async validateAnalyzers(): Promise<AnalyzerError[]> {
    const errors: AnalyzerError[] = [];

    for (const analyzer of this.analyzers) {
      try {
        const canRun = await analyzer.canRun();
        if (!canRun) {
          errors.push({
            analyzerName: analyzer.name,
            message: `Analyzer '${analyzer.name}' cannot run in the current environment`,
            recoverable: false
          });
        }
      } catch (error) {
        errors.push({
          analyzerName: analyzer.name,
          message: `Failed to validate analyzer '${analyzer.name}': ${error instanceof Error ? error.message : 'Unknown error'}`,
          originalError: error instanceof Error ? error : undefined,
          recoverable: false
        });
      }
    }

    return errors;
  }

  /**
   * Determine if an error is recoverable (analysis can continue with other analyzers)
   * @param error - The error to evaluate
   * @returns True if error is recoverable, false otherwise
   */
  private isRecoverableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Memory errors, file system errors, etc. are typically not recoverable
      const criticalErrors = [
        'ENOMEM',
        'ENOSPC',
        'EMFILE',
        'ENFILE'
      ];
      
      return !criticalErrors.some(criticalError => 
        error.message.includes(criticalError) || 
        (error as any).code === criticalError
      );
    }
    
    // Unknown errors are considered recoverable by default
    return true;
  }

  /**
   * Calculate current progress percentage
   * @returns Progress percentage (0-100)
   */
  private getProgressPercentage(): number {
    if (this.totalSteps === 0) return 0;
    return Math.round((this.completedSteps / this.totalSteps) * 100);
  }

  /**
   * Report progress to the callback if provided
   * @param step - Current step description
   * @param percentage - Progress percentage
   */
  private reportProgress(step: string, percentage: number): void {
    if (this.progressCallback) {
      this.progressCallback({
        currentStep: step,
        completedSteps: this.completedSteps,
        totalSteps: this.totalSteps,
        percentage,
        details: `${this.completedSteps}/${this.totalSteps} analyzers completed`
      });
    }
  }

  /**
   * Get estimated total time for all registered analyzers
   * @param inventorySize - Number of files in the inventory
   * @returns Estimated total time in milliseconds
   */
  getEstimatedTotalTime(inventorySize: number): number {
    return this.analyzers.reduce((total, analyzer) => {
      return total + analyzer.getEstimatedTime(inventorySize);
    }, 0);
  }

  /**
   * Get information about all registered analyzers
   * @returns Array of analyzer information
   */
  getAnalyzerInfo(): Array<{ name: string; description: string }> {
    return this.analyzers.map(analyzer => ({
      name: analyzer.name,
      description: analyzer.description
    }));
  }

  /**
   * Clear all registered analyzers
   */
  clearAnalyzers(): void {
    this.analyzers = [];
  }

  /**
   * Get performance optimizer instance for configuration
   */
  getPerformanceOptimizer(): PerformanceOptimizer {
    return this.performanceOptimizer;
  }

  /**
   * Clear analysis cache
   */
  async clearCache(): Promise<void> {
    await this.performanceOptimizer.clearCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    totalSize: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  } {
    return this.performanceOptimizer.getCacheStats();
  }
}