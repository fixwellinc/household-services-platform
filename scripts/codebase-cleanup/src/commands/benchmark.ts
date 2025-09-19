import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { Command } from 'commander';
import chalk from 'chalk';
import { PerformanceBenchmark } from '../utils/PerformanceBenchmark';
import { FileScanner } from '../core/FileScanner';
import { DuplicateFileAnalyzer } from '../analyzers/DuplicateFileAnalyzer';
import { DependencyAnalyzer } from '../analyzers/DependencyAnalyzer';
import { ConfigurationAnalyzer } from '../analyzers/ConfigurationAnalyzer';
import { DeadCodeAnalyzer } from '../analyzers/DeadCodeAnalyzer';
import { TestFileAnalyzer } from '../analyzers/TestFileAnalyzer';
import { FileStructureAnalyzer } from '../analyzers/FileStructureAnalyzer';

/**
 * Create benchmark command for CLI
 */
export function createBenchmarkCommand(): Command {
  const command = new Command('benchmark');
  
  command
    .description('Run performance benchmarks for the cleanup system')
    .option('-p, --path <path>', 'Root path to benchmark (default: current directory)', process.cwd())
    .option('-o, --output <path>', 'Output directory for benchmark results', './benchmark-results')
    .option('--scan-only', 'Only benchmark file scanning performance')
    .option('--analysis-only', 'Only benchmark analysis performance')
    .option('--full', 'Run full end-to-end benchmark (default)')
    .option('--workers <number>', 'Maximum number of workers to test', '0')
    .option('--iterations <number>', 'Number of iterations for each test', '1')
    .option('--memory-profile', 'Enable detailed memory profiling')
    .action(async (options) => {
      try {
        await runBenchmark(options);
      } catch (error) {
        console.error(chalk.red('Benchmark failed:'), error);
        process.exit(1);
      }
    });

  return command;
}

/**
 * Run performance benchmark based on options
 */
async function runBenchmark(options: any): Promise<void> {
  const rootPath = path.resolve(options.path);
  const outputPath = path.resolve(options.output);
  const maxWorkers = parseInt(options.workers) || os.cpus().length;
  const iterations = parseInt(options.iterations) || 1;

  console.log(chalk.blue('🚀 Starting Performance Benchmark'));
  console.log(chalk.gray(`Root path: ${rootPath}`));
  console.log(chalk.gray(`Output path: ${outputPath}`));
  console.log(chalk.gray(`Max workers: ${maxWorkers}`));
  console.log(chalk.gray(`Iterations: ${iterations}`));
  console.log();

  // Ensure output directory exists
  await fs.promises.mkdir(outputPath, { recursive: true });

  const benchmark = new PerformanceBenchmark();

  // System information
  console.log(chalk.yellow('📊 System Information'));
  console.log(`CPU Cores: ${os.cpus().length}`);
  console.log(`Total Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`);
  console.log(`Node.js Version: ${process.version}`);
  console.log(`Platform: ${os.platform()} ${os.arch()}`);
  console.log();

  // Enable garbage collection for memory profiling
  if (options.memoryProfile && global.gc) {
    console.log(chalk.yellow('🧠 Memory profiling enabled'));
  }

  let totalResults = 0;

  // File scanning benchmarks
  if (!options.analysisOnly) {
    console.log(chalk.yellow('📁 File Scanning Benchmarks'));
    
    for (let i = 0; i < iterations; i++) {
      if (iterations > 1) {
        console.log(chalk.gray(`Iteration ${i + 1}/${iterations}`));
      }

      const scanConfigs = [
        { enableParallel: false },
        { enableParallel: true, maxWorkers: 2 },
        { enableParallel: true, maxWorkers: Math.min(4, maxWorkers) },
        { enableParallel: true, maxWorkers: maxWorkers }
      ];

      const scanResults = await benchmark.benchmarkFileScanning(rootPath, scanConfigs);
      totalResults += scanResults.length;

      // Print results for this iteration
      printScanResults(scanResults);
    }
  }

  // Analysis benchmarks
  if (!options.scanOnly) {
    console.log(chalk.yellow('🔍 Analysis Benchmarks'));
    
    // Get file inventory for analysis benchmarks
    console.log('Preparing file inventory...');
    const scanner = new FileScanner(rootPath, undefined, {
      enableParallel: true,
      maxWorkers: Math.min(4, maxWorkers)
    });
    const inventory = await scanner.scanRepository();
    console.log(`Loaded ${inventory.length} files`);

    // Create analyzers
    const analyzers = [
      new DuplicateFileAnalyzer(),
      new DependencyAnalyzer(),
      new ConfigurationAnalyzer(),
      new DeadCodeAnalyzer(),
      new TestFileAnalyzer(),
      new FileStructureAnalyzer()
    ];

    for (let i = 0; i < iterations; i++) {
      if (iterations > 1) {
        console.log(chalk.gray(`Iteration ${i + 1}/${iterations}`));
      }

      const analysisConfigs = [
        { enableIncremental: false, maxParallelWorkers: 1 },
        { enableIncremental: true, maxParallelWorkers: 1 },
        { enableIncremental: false, maxParallelWorkers: Math.min(2, maxWorkers) },
        { enableIncremental: true, maxParallelWorkers: Math.min(2, maxWorkers) },
        { enableIncremental: true, maxParallelWorkers: maxWorkers }
      ];

      const analysisResults = await benchmark.benchmarkAnalysisOrchestration(
        inventory, 
        analyzers, 
        analysisConfigs
      );
      totalResults += analysisResults.length;

      // Print results for this iteration
      printAnalysisResults(analysisResults);
    }
  }

  // End-to-end benchmark
  if (options.full || (!options.scanOnly && !options.analysisOnly)) {
    console.log(chalk.yellow('🎯 End-to-End Benchmark'));
    
    const analyzers = [
      new DuplicateFileAnalyzer(),
      new DependencyAnalyzer(),
      new ConfigurationAnalyzer(),
      new DeadCodeAnalyzer()
    ];

    for (let i = 0; i < iterations; i++) {
      if (iterations > 1) {
        console.log(chalk.gray(`Iteration ${i + 1}/${iterations}`));
      }

      const endToEndResult = await benchmark.benchmarkEndToEnd(rootPath, analyzers);
      totalResults++;

      printEndToEndResult(endToEndResult);
    }
  }

  // Generate and save report
  console.log(chalk.yellow('📋 Generating Report'));
  const report = benchmark.generateReport();
  
  await benchmark.saveBenchmarkResults(outputPath);
  
  console.log();
  console.log(chalk.green('✅ Benchmark Complete'));
  console.log(chalk.gray(`Total tests run: ${totalResults}`));
  console.log(chalk.gray(`Results saved to: ${outputPath}`));
  
  // Print summary
  console.log();
  console.log(chalk.yellow('📈 Performance Summary'));
  const results = benchmark.getResults();
  
  if (results.length > 0) {
    const bestResult = results.reduce((best, current) => 
      current.fileStats.filesPerSecond > best.fileStats.filesPerSecond ? current : best
    );
    
    console.log(`Best performance: ${chalk.green(bestResult.name)}`);
    console.log(`Files per second: ${chalk.green(bestResult.fileStats.filesPerSecond.toString())}`);
    console.log(`Peak memory: ${chalk.blue(bestResult.memoryUsage.peakMemoryMB.toFixed(1))} MB`);
  }
}

/**
 * Print file scanning results
 */
function printScanResults(results: any[]): void {
  console.log();
  console.log('File Scanning Results:');
  console.log('┌─────────────────────────────┬──────────────┬─────────────┬──────────────┐');
  console.log('│ Configuration               │ Time (ms)    │ Files/sec   │ Memory (MB)  │');
  console.log('├─────────────────────────────┼──────────────┼─────────────┼──────────────┤');
  
  for (const result of results) {
    const config = result.name.replace('File Scanning - ', '');
    const time = result.executionTime.toString().padStart(12);
    const filesPerSec = result.fileStats.filesPerSecond.toString().padStart(11);
    const memory = result.memoryUsage.peakMemoryMB.toFixed(1).padStart(12);
    
    console.log(`│ ${config.padEnd(27)} │ ${time} │ ${filesPerSec} │ ${memory} │`);
  }
  
  console.log('└─────────────────────────────┴──────────────┴─────────────┴──────────────┘');
}

/**
 * Print analysis results
 */
function printAnalysisResults(results: any[]): void {
  console.log();
  console.log('Analysis Results:');
  console.log('┌─────────────────────────────┬──────────────┬─────────────┬──────────────┐');
  console.log('│ Configuration               │ Time (ms)    │ Files/sec   │ Memory (MB)  │');
  console.log('├─────────────────────────────┼──────────────┼─────────────┼──────────────┤');
  
  for (const result of results) {
    const config = result.name.replace('Analysis Orchestration - ', '');
    const time = result.executionTime.toString().padStart(12);
    const filesPerSec = result.fileStats.filesPerSecond.toString().padStart(11);
    const memory = result.memoryUsage.peakMemoryMB.toFixed(1).padStart(12);
    
    console.log(`│ ${config.padEnd(27)} │ ${time} │ ${filesPerSec} │ ${memory} │`);
  }
  
  console.log('└─────────────────────────────┴──────────────┴─────────────┴──────────────┘');
}

/**
 * Print end-to-end result
 */
function printEndToEndResult(result: any): void {
  console.log();
  console.log('End-to-End Results:');
  console.log(`Total files: ${chalk.cyan(result.fileStats.totalFiles.toString())}`);
  console.log(`Execution time: ${chalk.cyan(result.executionTime.toString())} ms`);
  console.log(`Files per second: ${chalk.green(result.fileStats.filesPerSecond.toString())}`);
  console.log(`Peak memory: ${chalk.blue(result.memoryUsage.peakMemoryMB.toFixed(1))} MB`);
  console.log(`Average file size: ${chalk.gray(Math.round(result.fileStats.averageFileSize).toString())} bytes`);
}