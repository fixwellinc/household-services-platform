#!/usr/bin/env node

/**
 * Example demonstrating performance optimization features
 * This script shows how to use the performance optimizer and benchmarking tools
 */

import * as path from 'path';
import * as os from 'os';
import { FileScanner } from '../core/FileScanner';
import { AnalysisOrchestrator } from '../core/AnalysisOrchestrator';
import { PerformanceBenchmark } from '../utils/PerformanceBenchmark';
import { DuplicateFileAnalyzer } from '../analyzers/DuplicateFileAnalyzer';
import { DependencyAnalyzer } from '../analyzers/DependencyAnalyzer';
import { ConfigurationAnalyzer } from '../analyzers/ConfigurationAnalyzer';

async function demonstratePerformanceOptimizations() {
  console.log('🚀 Performance Optimization Demonstration');
  console.log('=========================================\n');

  const rootPath = process.cwd();
  console.log(`Analyzing: ${rootPath}`);
  console.log(`System: ${os.cpus().length} cores, ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB RAM\n`);

  // 1. Demonstrate parallel file scanning
  console.log('1️⃣  Parallel File Scanning');
  console.log('---------------------------');

  console.log('Sequential scanning...');
  const sequentialScanner = new FileScanner(rootPath, undefined, {
    enableParallel: false
  });
  
  const startTime1 = Date.now();
  const inventory1 = await sequentialScanner.scanRepository();
  const sequentialTime = Date.now() - startTime1;
  
  console.log(`✅ Sequential: ${sequentialTime}ms, ${inventory1.length} files`);

  console.log('Parallel scanning...');
  const parallelScanner = new FileScanner(rootPath, undefined, {
    enableParallel: true,
    maxWorkers: os.cpus().length,
    enableMemoryOptimization: true
  });
  
  const startTime2 = Date.now();
  const inventory2 = await parallelScanner.scanRepository();
  const parallelTime = Date.now() - startTime2;
  
  console.log(`✅ Parallel: ${parallelTime}ms, ${inventory2.length} files`);
  console.log(`📈 Speedup: ${(sequentialTime / parallelTime).toFixed(2)}x\n`);

  // 2. Demonstrate incremental analysis
  console.log('2️⃣  Incremental Analysis');
  console.log('------------------------');

  const analyzers = [
    new DuplicateFileAnalyzer(),
    new DependencyAnalyzer(),
    new ConfigurationAnalyzer()
  ];

  // First run (no cache)
  console.log('First analysis run (building cache)...');
  const orchestrator1 = new AnalysisOrchestrator(undefined, {
    enableIncremental: true,
    maxParallelWorkers: os.cpus().length,
    cacheDir: path.join(os.tmpdir(), 'cleanup-demo-cache')
  });
  
  analyzers.forEach(analyzer => orchestrator1.registerAnalyzer(analyzer));
  
  const startTime3 = Date.now();
  await orchestrator1.executeAnalysis(inventory2);
  const firstRunTime = Date.now() - startTime3;
  
  console.log(`✅ First run: ${firstRunTime}ms`);

  // Second run (with cache)
  console.log('Second analysis run (using cache)...');
  const orchestrator2 = new AnalysisOrchestrator(undefined, {
    enableIncremental: true,
    maxParallelWorkers: os.cpus().length,
    cacheDir: path.join(os.tmpdir(), 'cleanup-demo-cache')
  });
  
  analyzers.forEach(analyzer => orchestrator2.registerAnalyzer(analyzer));
  
  const startTime4 = Date.now();
  await orchestrator2.executeAnalysis(inventory2);
  const secondRunTime = Date.now() - startTime4;
  
  console.log(`✅ Second run: ${secondRunTime}ms`);
  console.log(`📈 Cache benefit: ${(firstRunTime / secondRunTime).toFixed(2)}x faster\n`);

  // Show cache statistics
  const cacheStats = orchestrator2.getCacheStats();
  console.log('📊 Cache Statistics:');
  console.log(`   Entries: ${cacheStats.totalEntries}`);
  console.log(`   Size: ${Math.round(cacheStats.totalSize / 1024)} KB`);
  if (cacheStats.oldestEntry) {
    console.log(`   Oldest: ${cacheStats.oldestEntry.toLocaleString()}`);
  }
  if (cacheStats.newestEntry) {
    console.log(`   Newest: ${cacheStats.newestEntry.toLocaleString()}`);
  }
  console.log();

  // 3. Demonstrate memory optimization
  console.log('3️⃣  Memory Optimization');
  console.log('-----------------------');

  const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`Initial memory: ${initialMemory.toFixed(1)} MB`);

  // Process with memory optimization
  const optimizedScanner = new FileScanner(rootPath, undefined, {
    enableParallel: true,
    maxWorkers: 2,
    enableMemoryOptimization: true,
    batchSize: 50
  });

  const startTime5 = Date.now();
  const inventory3 = await optimizedScanner.scanRepository();
  const optimizedTime = Date.now() - startTime5;
  
  const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  const memoryIncrease = finalMemory - initialMemory;
  
  console.log(`✅ Optimized scan: ${optimizedTime}ms, ${inventory3.length} files`);
  console.log(`📊 Memory increase: ${memoryIncrease.toFixed(1)} MB`);
  console.log(`📊 Memory per file: ${(memoryIncrease / inventory3.length * 1024).toFixed(2)} KB\n`);

  // 4. Run comprehensive benchmark
  console.log('4️⃣  Comprehensive Benchmark');
  console.log('---------------------------');

  const benchmark = new PerformanceBenchmark();
  
  console.log('Running file scanning benchmarks...');
  await benchmark.benchmarkFileScanning(rootPath, [
    { enableParallel: false },
    { enableParallel: true, maxWorkers: 2 },
    { enableParallel: true, maxWorkers: os.cpus().length }
  ]);

  console.log('Running analysis benchmarks...');
  await benchmark.benchmarkAnalysisOrchestration(inventory2, analyzers.slice(0, 2), [
    { enableIncremental: false, maxParallelWorkers: 1 },
    { enableIncremental: true, maxParallelWorkers: 2 }
  ]);

  console.log('Running end-to-end benchmark...');
  await benchmark.benchmarkEndToEnd(rootPath, analyzers.slice(0, 2));

  // Generate and display report
  console.log('\n📋 Performance Report');
  console.log('=====================');
  const report = benchmark.generateReport();
  console.log(report);

  // Save results
  const outputDir = path.join(process.cwd(), 'performance-results');
  await benchmark.saveBenchmarkResults(outputDir);
  console.log(`\n💾 Detailed results saved to: ${outputDir}`);

  // Clean up cache
  await orchestrator2.clearCache();
  console.log('\n🧹 Cache cleaned up');

  console.log('\n✅ Performance optimization demonstration complete!');
}

// Run the demonstration
if (require.main === module) {
  demonstratePerformanceOptimizations().catch(error => {
    console.error('❌ Error during demonstration:', error);
    process.exit(1);
  });
}

export { demonstratePerformanceOptimizations };