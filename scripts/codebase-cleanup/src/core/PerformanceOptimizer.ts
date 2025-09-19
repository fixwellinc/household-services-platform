import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { FileInventory, Analyzer, AnalysisResult, ProgressInfo } from '../types';

/**
 * Configuration for performance optimization
 */
export interface PerformanceConfig {
  /** Maximum number of parallel workers (default: CPU cores) */
  maxParallelWorkers?: number;
  /** Memory limit per worker in MB (default: 512MB) */
  memoryLimitMB?: number;
  /** Enable incremental analysis (default: true) */
  enableIncremental?: boolean;
  /** Cache directory for incremental analysis */
  cacheDir?: string;
  /** Batch size for processing files (default: 100) */
  batchSize?: number;
  /** Enable memory optimization (default: true) */
  enableMemoryOptimization?: boolean;
}

/**
 * Cache entry for incremental analysis
 */
interface CacheEntry {
  /** File path */
  path: string;
  /** Content hash when last analyzed */
  contentHash: string;
  /** Last modification time when analyzed */
  lastModified: number;
  /** Cached analysis results */
  results: Map<string, AnalysisResult>;
}

/**
 * Performance optimizer for monorepo analysis
 */
export class PerformanceOptimizer {
  private config: Required<PerformanceConfig>;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheFilePath: string;

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      maxParallelWorkers: config.maxParallelWorkers ?? os.cpus().length,
      memoryLimitMB: config.memoryLimitMB ?? 512,
      enableIncremental: config.enableIncremental ?? true,
      cacheDir: config.cacheDir ?? path.join(process.cwd(), '.cleanup-cache'),
      batchSize: config.batchSize ?? 100,
      enableMemoryOptimization: config.enableMemoryOptimization ?? true
    };

    this.cacheFilePath = path.join(this.config.cacheDir, 'analysis-cache.json');
    this.loadCache();
  }

  /**
   * Optimize analyzer execution with parallel processing and incremental analysis
   */
  async optimizeAnalysis(
    analyzers: Analyzer[],
    inventory: FileInventory[],
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<AnalysisResult[]> {
    const startTime = Date.now();
    
    // Filter inventory for incremental analysis
    const { changedFiles, cachedResults } = this.getIncrementalChanges(inventory, analyzers);
    
    if (progressCallback) {
      progressCallback({
        currentStep: 'Preparing optimized analysis',
        completedSteps: 0,
        totalSteps: analyzers.length,
        percentage: 0,
        details: `${changedFiles.length} files need analysis, ${cachedResults.length} cached results`
      });
    }

    // Group analyzers by independence for parallel execution
    const analyzerGroups = this.groupAnalyzersByDependencies(analyzers);
    const allResults: AnalysisResult[] = [...cachedResults];

    let completedAnalyzers = 0;
    const totalAnalyzers = analyzers.length;

    // Execute analyzer groups in parallel
    for (const group of analyzerGroups) {
      const groupResults = await this.executeAnalyzerGroup(
        group,
        changedFiles,
        (progress) => {
          if (progressCallback) {
            const overallProgress = Math.round(
              ((completedAnalyzers + progress.percentage / 100) / totalAnalyzers) * 100
            );
            progressCallback({
              currentStep: `Group ${analyzerGroups.indexOf(group) + 1}: ${progress.currentStep}`,
              completedSteps: completedAnalyzers,
              totalSteps: totalAnalyzers,
              percentage: overallProgress,
              details: progress.details
            });
          }
        }
      );

      allResults.push(...groupResults);
      completedAnalyzers += group.length;

      // Update cache with new results
      this.updateCache(changedFiles, group, groupResults);
    }

    // Save cache for next run
    await this.saveCache();

    const totalTime = Date.now() - startTime;
    console.log(`Optimized analysis completed in ${totalTime}ms`);
    console.log(`Processed ${changedFiles.length} changed files, used ${cachedResults.length} cached results`);

    return allResults;
  }

  /**
   * Determine which files have changed since last analysis
   */
  private getIncrementalChanges(
    inventory: FileInventory[],
    analyzers: Analyzer[]
  ): { changedFiles: FileInventory[]; cachedResults: AnalysisResult[] } {
    if (!this.config.enableIncremental) {
      return { changedFiles: inventory, cachedResults: [] };
    }

    const changedFiles: FileInventory[] = [];
    const cachedResults: AnalysisResult[] = [];

    for (const file of inventory) {
      const cacheEntry = this.cache.get(file.path);
      
      if (!cacheEntry || 
          cacheEntry.contentHash !== file.contentHash ||
          cacheEntry.lastModified !== file.lastModified.getTime()) {
        // File has changed or not in cache
        changedFiles.push(file);
      } else {
        // File unchanged, use cached results
        for (const analyzer of analyzers) {
          const cachedResult = cacheEntry.results.get(analyzer.name);
          if (cachedResult) {
            cachedResults.push(cachedResult);
          } else {
            // Analyzer not in cache, need to analyze this file
            changedFiles.push(file);
            break;
          }
        }
      }
    }

    return { changedFiles, cachedResults };
  }

  /**
   * Group analyzers by their dependencies for parallel execution
   */
  private groupAnalyzersByDependencies(analyzers: Analyzer[]): Analyzer[][] {
    // For now, we'll use a simple heuristic:
    // - File-level analyzers can run in parallel
    // - Cross-file analyzers should run after file-level ones
    
    const fileLevelAnalyzers: Analyzer[] = [];
    const crossFileAnalyzers: Analyzer[] = [];

    for (const analyzer of analyzers) {
      // Heuristic: analyzers with "File" in name are typically file-level
      if (analyzer.name.includes('File') || 
          analyzer.name.includes('Duplicate') ||
          analyzer.name.includes('Configuration')) {
        fileLevelAnalyzers.push(analyzer);
      } else {
        crossFileAnalyzers.push(analyzer);
      }
    }

    const groups: Analyzer[][] = [];
    
    if (fileLevelAnalyzers.length > 0) {
      // Split file-level analyzers into parallel groups
      const groupSize = Math.ceil(fileLevelAnalyzers.length / this.config.maxParallelWorkers);
      for (let i = 0; i < fileLevelAnalyzers.length; i += groupSize) {
        groups.push(fileLevelAnalyzers.slice(i, i + groupSize));
      }
    }

    if (crossFileAnalyzers.length > 0) {
      // Cross-file analyzers run sequentially after file-level ones
      groups.push(crossFileAnalyzers);
    }

    return groups;
  }

  /**
   * Execute a group of analyzers in parallel with memory optimization
   */
  private async executeAnalyzerGroup(
    analyzers: Analyzer[],
    inventory: FileInventory[],
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<AnalysisResult[]> {
    if (analyzers.length === 1) {
      // Single analyzer, no need for parallelization overhead
      return [await analyzers[0].analyze(inventory, progressCallback)];
    }

    // Process inventory in batches to manage memory
    const batches = this.createBatches(inventory);
    const results: AnalysisResult[] = [];

    let completedBatches = 0;
    const totalBatches = batches.length;

    for (const batch of batches) {
      // Execute analyzers in parallel for this batch
      const batchPromises = analyzers.map(async (analyzer) => {
        const batchProgressCallback = (progress: ProgressInfo) => {
          if (progressCallback) {
            const overallProgress = Math.round(
              ((completedBatches + progress.percentage / 100) / totalBatches) * 100
            );
            progressCallback({
              currentStep: `${analyzer.name} (batch ${completedBatches + 1}/${totalBatches})`,
              completedSteps: completedBatches,
              totalSteps: totalBatches,
              percentage: overallProgress,
              details: progress.details
            });
          }
        };

        return analyzer.analyze(batch, batchProgressCallback);
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      completedBatches++;

      // Force garbage collection between batches if memory optimization is enabled
      if (this.config.enableMemoryOptimization && global.gc) {
        global.gc();
      }
    }

    return results;
  }

  /**
   * Create batches of files for memory-efficient processing
   */
  private createBatches(inventory: FileInventory[]): FileInventory[][] {
    if (!this.config.enableMemoryOptimization) {
      return [inventory];
    }

    const batches: FileInventory[][] = [];
    const batchSize = this.config.batchSize;

    for (let i = 0; i < inventory.length; i += batchSize) {
      batches.push(inventory.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Update cache with new analysis results
   */
  private updateCache(
    files: FileInventory[],
    analyzers: Analyzer[],
    results: AnalysisResult[]
  ): void {
    if (!this.config.enableIncremental) {
      return;
    }

    // Group results by analyzer
    const resultsByAnalyzer = new Map<string, AnalysisResult>();
    for (const result of results) {
      resultsByAnalyzer.set(result.analyzer, result);
    }

    // Update cache entries
    for (const file of files) {
      let cacheEntry = this.cache.get(file.path);
      
      if (!cacheEntry) {
        cacheEntry = {
          path: file.path,
          contentHash: file.contentHash,
          lastModified: file.lastModified.getTime(),
          results: new Map()
        };
        this.cache.set(file.path, cacheEntry);
      }

      // Update cache entry with new results
      cacheEntry.contentHash = file.contentHash;
      cacheEntry.lastModified = file.lastModified.getTime();

      for (const analyzer of analyzers) {
        const result = resultsByAnalyzer.get(analyzer.name);
        if (result) {
          cacheEntry.results.set(analyzer.name, result);
        }
      }
    }
  }

  /**
   * Load cache from disk
   */
  private loadCache(): void {
    if (!this.config.enableIncremental) {
      return;
    }

    try {
      if (fs.existsSync(this.cacheFilePath)) {
        const cacheData = JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf8'));
        
        for (const [path, entry] of Object.entries(cacheData)) {
          const cacheEntry = entry as any;
          this.cache.set(path, {
            path: cacheEntry.path,
            contentHash: cacheEntry.contentHash,
            lastModified: cacheEntry.lastModified,
            results: new Map(Object.entries(cacheEntry.results || {}))
          });
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not load analysis cache: ${error}`);
      this.cache.clear();
    }
  }

  /**
   * Save cache to disk
   */
  private async saveCache(): Promise<void> {
    if (!this.config.enableIncremental) {
      return;
    }

    try {
      // Ensure cache directory exists
      await fs.promises.mkdir(this.config.cacheDir, { recursive: true });

      // Convert cache to serializable format
      const cacheData: any = {};
      for (const [path, entry] of this.cache.entries()) {
        cacheData[path] = {
          path: entry.path,
          contentHash: entry.contentHash,
          lastModified: entry.lastModified,
          results: Object.fromEntries(entry.results.entries())
        };
      }

      await fs.promises.writeFile(
        this.cacheFilePath,
        JSON.stringify(cacheData, null, 2),
        'utf8'
      );
    } catch (error) {
      console.warn(`Warning: Could not save analysis cache: ${error}`);
    }
  }

  /**
   * Clear the analysis cache
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        await fs.promises.unlink(this.cacheFilePath);
      }
    } catch (error) {
      console.warn(`Warning: Could not clear cache file: ${error}`);
    }
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
    let totalSize = 0;
    let oldestTime = Number.MAX_SAFE_INTEGER;
    let newestTime = 0;

    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry).length;
      oldestTime = Math.min(oldestTime, entry.lastModified);
      newestTime = Math.max(newestTime, entry.lastModified);
    }

    return {
      totalEntries: this.cache.size,
      totalSize,
      oldestEntry: oldestTime !== Number.MAX_SAFE_INTEGER ? new Date(oldestTime) : undefined,
      newestEntry: newestTime > 0 ? new Date(newestTime) : undefined
    };
  }
}