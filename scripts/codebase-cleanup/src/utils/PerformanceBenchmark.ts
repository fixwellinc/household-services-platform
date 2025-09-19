import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { FileScanner, ScannerConfig } from '../core/FileScanner';
import { AnalysisOrchestrator } from '../core/AnalysisOrchestrator';
import { PerformanceConfig } from '../core/PerformanceOptimizer';
import { FileInventory, Analyzer, ProgressInfo } from '../types';

/**
 * Performance benchmark results
 */
export interface BenchmarkResult {
  /** Test name */
  name: string;
  /** Total execution time in milliseconds */
  executionTime: number;
  /** Memory usage statistics */
  memoryUsage: {
    /** Peak memory usage in MB */
    peakMemoryMB: number;
    /** Memory usage at start in MB */
    startMemoryMB: number;
    /** Memory usage at end in MB */
    endMemoryMB: number;
  };
  /** File processing statistics */
  fileStats: {
    /** Total files processed */
    totalFiles: number;
    /** Files processed per second */
    filesPerSecond: number;
    /** Average file size in bytes */
    averageFileSize: number;
  };
  /** System information */
  systemInfo: {
    /** Number of CPU cores */
    cpuCores: number;
    /** Total system memory in MB */
    totalMemoryMB: number;
    /** Node.js version */
    nodeVersion: string;
  };
  /** Configuration used for the test */
  config: any;
}

/**
 * Performance benchmarking utility for the cleanup system
 */
export class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];

  /**
   * Benchmark file scanning performance
   */
  async benchmarkFileScanning(
    rootPath: string,
    configs: ScannerConfig[] = [
      { enableParallel: false }, // Sequential
      { enableParallel: true, maxWorkers: 2 }, // Parallel with 2 workers
      { enableParallel: true, maxWorkers: 4 }, // Parallel with 4 workers
      { enableParallel: true, maxWorkers: os.cpus().length }, // Parallel with all cores
    ]
  ): Promise<BenchmarkResult[]> {
    const benchmarkResults: BenchmarkResult[] = [];

    for (const config of configs) {
      const configName = config.enableParallel 
        ? `Parallel (${config.maxWorkers} workers)`
        : 'Sequential';

      console.log(`\nBenchmarking file scanning: ${configName}`);

      const result = await this.runFileScanningBenchmark(rootPath, config, configName);
      benchmarkResults.push(result);
      this.results.push(result);

      // Force garbage collection between tests
      if (global.gc) {
        global.gc();
      }

      // Wait a bit between tests to let system stabilize
      await this.sleep(1000);
    }

    return benchmarkResults;
  }

  /**
   * Benchmark analysis orchestration performance
   */
  async benchmarkAnalysisOrchestration(
    inventory: FileInventory[],
    analyzers: Analyzer[],
    configs: PerformanceConfig[] = [
      { enableIncremental: false, maxParallelWorkers: 1 }, // Sequential, no cache
      { enableIncremental: true, maxParallelWorkers: 1 }, // Sequential, with cache
      { enableIncremental: false, maxParallelWorkers: 2 }, // Parallel, no cache
      { enableIncremental: true, maxParallelWorkers: 2 }, // Parallel, with cache
      { enableIncremental: true, maxParallelWorkers: os.cpus().length }, // Full parallel, with cache
    ]
  ): Promise<BenchmarkResult[]> {
    const benchmarkResults: BenchmarkResult[] = [];

    for (const config of configs) {
      const configName = `${config.enableIncremental ? 'Incremental' : 'Full'} + ` +
                        `${config.maxParallelWorkers === 1 ? 'Sequential' : `Parallel(${config.maxParallelWorkers})`}`;

      console.log(`\nBenchmarking analysis orchestration: ${configName}`);

      const result = await this.runAnalysisOrchestrationBenchmark(
        inventory, 
        analyzers, 
        config, 
        configName
      );
      benchmarkResults.push(result);
      this.results.push(result);

      // Force garbage collection between tests
      if (global.gc) {
        global.gc();
      }

      // Wait a bit between tests
      await this.sleep(1000);
    }

    return benchmarkResults;
  }

  /**
   * Run a complete end-to-end benchmark
   */
  async benchmarkEndToEnd(
    rootPath: string,
    analyzers: Analyzer[]
  ): Promise<BenchmarkResult> {
    console.log('\nRunning end-to-end benchmark...');

    const startTime = Date.now();
    const startMemory = this.getMemoryUsageMB();
    let peakMemory = startMemory;

    // Monitor memory usage during execution
    const memoryMonitor = setInterval(() => {
      const currentMemory = this.getMemoryUsageMB();
      peakMemory = Math.max(peakMemory, currentMemory);
    }, 100);

    try {
      // File scanning
      const scanner = new FileScanner(rootPath, undefined, {
        enableParallel: true,
        maxWorkers: os.cpus().length,
        enableMemoryOptimization: true
      });
      
      const inventory = await scanner.scanRepository();

      // Analysis orchestration
      const orchestrator = new AnalysisOrchestrator(undefined, {
        enableIncremental: true,
        maxParallelWorkers: os.cpus().length,
        enableMemoryOptimization: true
      });

      analyzers.forEach(analyzer => orchestrator.registerAnalyzer(analyzer));
      await orchestrator.executeAnalysis(inventory);

      const endTime = Date.now();
      const endMemory = this.getMemoryUsageMB();
      const executionTime = endTime - startTime;

      const result: BenchmarkResult = {
        name: 'End-to-End Optimized',
        executionTime,
        memoryUsage: {
          peakMemoryMB: peakMemory,
          startMemoryMB: startMemory,
          endMemoryMB: endMemory
        },
        fileStats: {
          totalFiles: inventory.length,
          filesPerSecond: Math.round(inventory.length / (executionTime / 1000)),
          averageFileSize: inventory.reduce((sum, file) => sum + file.size, 0) / inventory.length
        },
        systemInfo: this.getSystemInfo(),
        config: {
          scannerConfig: { enableParallel: true, maxWorkers: os.cpus().length },
          performanceConfig: { enableIncremental: true, maxParallelWorkers: os.cpus().length }
        }
      };

      this.results.push(result);
      return result;

    } finally {
      clearInterval(memoryMonitor);
    }
  }

  /**
   * Run file scanning benchmark
   */
  private async runFileScanningBenchmark(
    rootPath: string,
    config: ScannerConfig,
    name: string
  ): Promise<BenchmarkResult> {
    const startTime = Date.now();
    const startMemory = this.getMemoryUsageMB();
    let peakMemory = startMemory;

    const memoryMonitor = setInterval(() => {
      const currentMemory = this.getMemoryUsageMB();
      peakMemory = Math.max(peakMemory, currentMemory);
    }, 100);

    try {
      const scanner = new FileScanner(rootPath, undefined, config);
      const inventory = await scanner.scanRepository();

      const endTime = Date.now();
      const endMemory = this.getMemoryUsageMB();
      const executionTime = endTime - startTime;

      return {
        name: `File Scanning - ${name}`,
        executionTime,
        memoryUsage: {
          peakMemoryMB: peakMemory,
          startMemoryMB: startMemory,
          endMemoryMB: endMemory
        },
        fileStats: {
          totalFiles: inventory.length,
          filesPerSecond: Math.round(inventory.length / (executionTime / 1000)),
          averageFileSize: inventory.reduce((sum, file) => sum + file.size, 0) / inventory.length
        },
        systemInfo: this.getSystemInfo(),
        config
      };

    } finally {
      clearInterval(memoryMonitor);
    }
  }

  /**
   * Run analysis orchestration benchmark
   */
  private async runAnalysisOrchestrationBenchmark(
    inventory: FileInventory[],
    analyzers: Analyzer[],
    config: PerformanceConfig,
    name: string
  ): Promise<BenchmarkResult> {
    const startTime = Date.now();
    const startMemory = this.getMemoryUsageMB();
    let peakMemory = startMemory;

    const memoryMonitor = setInterval(() => {
      const currentMemory = this.getMemoryUsageMB();
      peakMemory = Math.max(peakMemory, currentMemory);
    }, 100);

    try {
      const orchestrator = new AnalysisOrchestrator(undefined, config);
      analyzers.forEach(analyzer => orchestrator.registerAnalyzer(analyzer));
      
      await orchestrator.executeAnalysis(inventory);

      const endTime = Date.now();
      const endMemory = this.getMemoryUsageMB();
      const executionTime = endTime - startTime;

      return {
        name: `Analysis Orchestration - ${name}`,
        executionTime,
        memoryUsage: {
          peakMemoryMB: peakMemory,
          startMemoryMB: startMemory,
          endMemoryMB: endMemory
        },
        fileStats: {
          totalFiles: inventory.length,
          filesPerSecond: Math.round(inventory.length / (executionTime / 1000)),
          averageFileSize: inventory.reduce((sum, file) => sum + file.size, 0) / inventory.length
        },
        systemInfo: this.getSystemInfo(),
        config
      };

    } finally {
      clearInterval(memoryMonitor);
    }
  }

  /**
   * Generate a comprehensive performance report
   */
  generateReport(): string {
    if (this.results.length === 0) {
      return 'No benchmark results available.';
    }

    let report = '# Performance Benchmark Report\n\n';
    
    // System information
    const systemInfo = this.results[0].systemInfo;
    report += `## System Information\n`;
    report += `- CPU Cores: ${systemInfo.cpuCores}\n`;
    report += `- Total Memory: ${systemInfo.totalMemoryMB} MB\n`;
    report += `- Node.js Version: ${systemInfo.nodeVersion}\n\n`;

    // Results table
    report += `## Benchmark Results\n\n`;
    report += `| Test Name | Execution Time (ms) | Files/sec | Peak Memory (MB) | Memory Efficiency |\n`;
    report += `|-----------|-------------------|-----------|------------------|------------------|\n`;

    for (const result of this.results) {
      const memoryEfficiency = result.fileStats.totalFiles / result.memoryUsage.peakMemoryMB;
      report += `| ${result.name} | ${result.executionTime} | ${result.fileStats.filesPerSecond} | ${result.memoryUsage.peakMemoryMB.toFixed(1)} | ${memoryEfficiency.toFixed(1)} files/MB |\n`;
    }

    // Performance analysis
    report += `\n## Performance Analysis\n\n`;
    
    const fileScanningResults = this.results.filter(r => r.name.includes('File Scanning'));
    if (fileScanningResults.length > 1) {
      const sequential = fileScanningResults.find(r => r.name.includes('Sequential'));
      const parallel = fileScanningResults.filter(r => r.name.includes('Parallel'));
      
      if (sequential && parallel.length > 0) {
        const bestParallel = parallel.reduce((best, current) => 
          current.executionTime < best.executionTime ? current : best
        );
        
        const speedup = sequential.executionTime / bestParallel.executionTime;
        report += `### File Scanning Performance\n`;
        report += `- Sequential: ${sequential.executionTime}ms\n`;
        report += `- Best Parallel: ${bestParallel.executionTime}ms (${bestParallel.name})\n`;
        report += `- Speedup: ${speedup.toFixed(2)}x\n\n`;
      }
    }

    // Recommendations
    report += `## Recommendations\n\n`;
    
    const bestOverall = this.results.reduce((best, current) => 
      current.fileStats.filesPerSecond > best.fileStats.filesPerSecond ? current : best
    );
    
    report += `- Best performing configuration: ${bestOverall.name}\n`;
    report += `- Achieved ${bestOverall.fileStats.filesPerSecond} files/second\n`;
    report += `- Peak memory usage: ${bestOverall.memoryUsage.peakMemoryMB.toFixed(1)} MB\n`;

    return report;
  }

  /**
   * Save benchmark results to file
   */
  async saveBenchmarkResults(outputPath: string): Promise<void> {
    const report = this.generateReport();
    const jsonResults = JSON.stringify(this.results, null, 2);
    
    // Save markdown report
    const reportPath = path.join(outputPath, 'performance-report.md');
    await fs.promises.writeFile(reportPath, report, 'utf8');
    
    // Save JSON results
    const jsonPath = path.join(outputPath, 'benchmark-results.json');
    await fs.promises.writeFile(jsonPath, jsonResults, 'utf8');
    
    console.log(`Benchmark results saved to:`);
    console.log(`- Report: ${reportPath}`);
    console.log(`- Raw data: ${jsonPath}`);
  }

  /**
   * Get current memory usage in MB
   */
  private getMemoryUsageMB(): number {
    const usage = process.memoryUsage();
    return Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100;
  }

  /**
   * Get system information
   */
  private getSystemInfo() {
    return {
      cpuCores: os.cpus().length,
      totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
      nodeVersion: process.version
    };
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all benchmark results
   */
  clearResults(): void {
    this.results = [];
  }

  /**
   * Get all benchmark results
   */
  getResults(): BenchmarkResult[] {
    return [...this.results];
  }
}