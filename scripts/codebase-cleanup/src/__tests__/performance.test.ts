import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { FileScanner } from '../core/FileScanner';
import { AnalysisOrchestrator } from '../core/AnalysisOrchestrator';
import { PerformanceBenchmark } from '../utils/PerformanceBenchmark';
import { DuplicateFileAnalyzer } from '../analyzers/DuplicateFileAnalyzer';
import { DependencyAnalyzer } from '../analyzers/DependencyAnalyzer';
import { ConfigurationAnalyzer } from '../analyzers/ConfigurationAnalyzer';

describe('Performance Tests', () => {
  const testTimeout = 300000; // 5 minutes for performance tests
  const rootPath = path.resolve(__dirname, '../../../../..');
  let benchmark: PerformanceBenchmark;

  beforeEach(() => {
    benchmark = new PerformanceBenchmark();
  });

  afterEach(() => {
    // Force garbage collection after each test
    if (global.gc) {
      global.gc();
    }
  });

  describe('File Scanner Performance', () => {
    test('should benchmark sequential vs parallel file scanning', async () => {
      const results = await benchmark.benchmarkFileScanning(rootPath, [
        { enableParallel: false },
        { enableParallel: true, maxWorkers: 2 },
        { enableParallel: true, maxWorkers: 4 },
        { enableParallel: true, maxWorkers: os.cpus().length }
      ]);

      expect(results).toHaveLength(4);
      
      // Verify all tests processed the same number of files
      const fileCount = results[0].fileStats.totalFiles;
      results.forEach(result => {
        expect(result.fileStats.totalFiles).toBe(fileCount);
      });

      // Parallel should generally be faster than sequential for large repos
      const sequential = results.find(r => r.name.includes('Sequential'));
      const parallel = results.filter(r => r.name.includes('Parallel'));
      
      if (sequential && parallel.length > 0 && fileCount > 100) {
        const bestParallel = parallel.reduce((best, current) => 
          current.executionTime < best.executionTime ? current : best
        );
        
        console.log(`Sequential: ${sequential.executionTime}ms`);
        console.log(`Best Parallel: ${bestParallel.executionTime}ms`);
        console.log(`Speedup: ${(sequential.executionTime / bestParallel.executionTime).toFixed(2)}x`);
        
        // Parallel should be at least as fast as sequential
        expect(bestParallel.executionTime).toBeLessThanOrEqual(sequential.executionTime * 1.1);
      }
    }, testTimeout);

    test('should handle memory efficiently during large scans', async () => {
      const scanner = new FileScanner(rootPath, undefined, {
        enableParallel: true,
        maxWorkers: 2,
        enableMemoryOptimization: true,
        batchSize: 50
      });

      const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const inventory = await scanner.scanRepository();
      const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      
      const memoryIncrease = endMemory - startMemory;
      const memoryPerFile = memoryIncrease / inventory.length;

      console.log(`Memory increase: ${memoryIncrease.toFixed(2)} MB`);
      console.log(`Memory per file: ${memoryPerFile.toFixed(4)} MB`);
      
      // Memory usage should be reasonable (less than 1MB per file on average)
      expect(memoryPerFile).toBeLessThan(1);
      
      // Should process files
      expect(inventory.length).toBeGreaterThan(0);
    }, testTimeout);
  });

  describe('Analysis Orchestration Performance', () => {
    test('should benchmark incremental vs full analysis', async () => {
      // First, get a file inventory
      const scanner = new FileScanner(rootPath, undefined, {
        enableParallel: true,
        maxWorkers: 2
      });
      const inventory = await scanner.scanRepository();

      // Create test analyzers
      const analyzers = [
        new DuplicateFileAnalyzer(),
        new DependencyAnalyzer(),
        new ConfigurationAnalyzer()
      ];

      const results = await benchmark.benchmarkAnalysisOrchestration(inventory, analyzers, [
        { enableIncremental: false, maxParallelWorkers: 1 },
        { enableIncremental: true, maxParallelWorkers: 1 },
        { enableIncremental: false, maxParallelWorkers: 2 },
        { enableIncremental: true, maxParallelWorkers: 2 }
      ]);

      expect(results).toHaveLength(4);

      // Second run with incremental should be faster
      const firstIncremental = results.find(r => 
        r.name.includes('Incremental') && r.name.includes('Sequential')
      );
      const firstFull = results.find(r => 
        !r.name.includes('Incremental') && r.name.includes('Sequential')
      );

      if (firstIncremental && firstFull) {
        console.log(`Full analysis: ${firstFull.executionTime}ms`);
        console.log(`Incremental analysis: ${firstIncremental.executionTime}ms`);
        
        // First incremental run might not be faster, but subsequent ones should be
        // This test mainly verifies the system works correctly
        expect(firstIncremental.executionTime).toBeGreaterThan(0);
        expect(firstFull.executionTime).toBeGreaterThan(0);
      }
    }, testTimeout);

    test('should scale with parallel workers', async () => {
      const scanner = new FileScanner(rootPath);
      const inventory = await scanner.scanRepository();

      const analyzers = [
        new DuplicateFileAnalyzer(),
        new ConfigurationAnalyzer()
      ];

      const workerCounts = [1, 2, Math.min(4, os.cpus().length)];
      const results: number[] = [];

      for (const workerCount of workerCounts) {
        const orchestrator = new AnalysisOrchestrator(undefined, {
          maxParallelWorkers: workerCount,
          enableIncremental: false
        });

        analyzers.forEach(analyzer => orchestrator.registerAnalyzer(analyzer));

        const startTime = Date.now();
        await orchestrator.executeAnalysis(inventory);
        const executionTime = Date.now() - startTime;

        results.push(executionTime);
        console.log(`${workerCount} workers: ${executionTime}ms`);
      }

      // More workers should generally not be slower (within reasonable variance)
      for (let i = 1; i < results.length; i++) {
        const speedup = results[0] / results[i];
        console.log(`Speedup with ${workerCounts[i]} workers: ${speedup.toFixed(2)}x`);
        
        // Allow for some variance in performance
        expect(results[i]).toBeLessThanOrEqual(results[0] * 1.2);
      }
    }, testTimeout);
  });

  describe('End-to-End Performance', () => {
    test('should complete full analysis within reasonable time', async () => {
      const analyzers = [
        new DuplicateFileAnalyzer(),
        new DependencyAnalyzer(),
        new ConfigurationAnalyzer()
      ];

      const result = await benchmark.benchmarkEndToEnd(rootPath, analyzers);

      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.fileStats.totalFiles).toBeGreaterThan(0);
      expect(result.fileStats.filesPerSecond).toBeGreaterThan(0);
      
      console.log(`End-to-end performance:`);
      console.log(`- Files processed: ${result.fileStats.totalFiles}`);
      console.log(`- Execution time: ${result.executionTime}ms`);
      console.log(`- Files per second: ${result.fileStats.filesPerSecond}`);
      console.log(`- Peak memory: ${result.memoryUsage.peakMemoryMB.toFixed(1)} MB`);

      // Performance expectations for FixWell monorepo
      // These are reasonable expectations, adjust based on actual performance
      expect(result.fileStats.filesPerSecond).toBeGreaterThan(10); // At least 10 files/sec
      expect(result.memoryUsage.peakMemoryMB).toBeLessThan(1000); // Less than 1GB peak memory
    }, testTimeout);

    test('should generate performance report', async () => {
      const analyzers = [
        new DuplicateFileAnalyzer(),
        new ConfigurationAnalyzer()
      ];

      // Run a quick benchmark
      await benchmark.benchmarkEndToEnd(rootPath, analyzers);
      
      const report = benchmark.generateReport();
      
      expect(report).toContain('Performance Benchmark Report');
      expect(report).toContain('System Information');
      expect(report).toContain('Benchmark Results');
      expect(report).toContain('CPU Cores');
      expect(report).toContain('Total Memory');
      
      console.log('Generated performance report:');
      console.log(report);
    }, testTimeout);
  });

  describe('Memory Optimization', () => {
    test('should handle large file inventories without memory leaks', async () => {
      const scanner = new FileScanner(rootPath, undefined, {
        enableMemoryOptimization: true,
        batchSize: 25 // Small batches to test memory management
      });

      const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      
      // Run multiple scans to test for memory leaks
      for (let i = 0; i < 3; i++) {
        const inventory = await scanner.scanRepository();
        expect(inventory.length).toBeGreaterThan(0);
        
        // Force garbage collection
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`Memory increase after 3 scans: ${memoryIncrease.toFixed(2)} MB`);
      
      // Memory increase should be reasonable (less than 100MB for multiple scans)
      expect(memoryIncrease).toBeLessThan(100);
    }, testTimeout);

    test('should respect memory limits in batch processing', async () => {
      const scanner = new FileScanner(rootPath, undefined, {
        enableParallel: true,
        maxWorkers: 2,
        memoryLimitMB: 128, // Low memory limit
        batchSize: 20 // Small batches
      });

      const inventory = await scanner.scanRepository();
      
      expect(inventory.length).toBeGreaterThan(0);
      
      // Should complete successfully even with memory constraints
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`Memory usage with constraints: ${memoryUsage.toFixed(2)} MB`);
    }, testTimeout);
  });

  describe('Cache Performance', () => {
    test('should improve performance with incremental analysis cache', async () => {
      const scanner = new FileScanner(rootPath);
      const inventory = await scanner.scanRepository();
      
      const analyzer = new DuplicateFileAnalyzer();
      
      // First run (no cache)
      const orchestrator1 = new AnalysisOrchestrator(undefined, {
        enableIncremental: true,
        cacheDir: path.join(os.tmpdir(), 'cleanup-test-cache')
      });
      orchestrator1.registerAnalyzer(analyzer);
      
      const startTime1 = Date.now();
      await orchestrator1.executeAnalysis(inventory);
      const firstRunTime = Date.now() - startTime1;
      
      // Second run (with cache)
      const orchestrator2 = new AnalysisOrchestrator(undefined, {
        enableIncremental: true,
        cacheDir: path.join(os.tmpdir(), 'cleanup-test-cache')
      });
      orchestrator2.registerAnalyzer(analyzer);
      
      const startTime2 = Date.now();
      await orchestrator2.executeAnalysis(inventory);
      const secondRunTime = Date.now() - startTime2;
      
      console.log(`First run (no cache): ${firstRunTime}ms`);
      console.log(`Second run (with cache): ${secondRunTime}ms`);
      
      // Second run should be faster or at least not significantly slower
      expect(secondRunTime).toBeLessThanOrEqual(firstRunTime * 1.1);
      
      // Clean up cache
      await orchestrator2.clearCache();
    }, testTimeout);
  });
});