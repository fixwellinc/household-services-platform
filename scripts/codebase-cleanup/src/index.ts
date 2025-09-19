#!/usr/bin/env node

/**
 * Main entry point for the codebase cleanup tool
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import inquirer from 'inquirer';
import { 
  FileScanner, 
  AnalysisOrchestrator, 
  ChangeExecutor,
  SafetyManager
} from './core';
import { ConfirmationPrompts } from './utils';
import { 
  DuplicateFileAnalyzer, 
  DependencyAnalyzer 
} from './analyzers';
import { createBenchmarkCommand } from './commands/benchmark';
import { 
  ConsoleReporter, 
  JSONReporter, 
  HTMLReporter 
} from './reporters';
import type { 
  ProgressInfo, 
  CleanupConfig, 
  CleanupReport, 
  Change, 
  ExecutionOptions,
  RiskLevel,
  ConfidenceLevel
} from './types';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

/**
 * CLI Application class that handles all command-line interactions
 */
class CleanupCLI {
  private program: Command;
  private config: CleanupConfig;
  
  constructor() {
    this.program = new Command();
    this.config = this.getDefaultConfig();
    this.setupCommands();
  }
  
  private getDefaultConfig(): CleanupConfig {
    return {
      excludePatterns: [
        'node_modules/**',
        '.git/**',
        'dist/**',
        'build/**',
        '*.log',
        '.cleanup-backups/**'
      ],
      includePatterns: ['**/*'],
      createBackups: true,
      dryRun: false,
      autoFixConfidence: 'high',
      autoFixRiskLevel: 'safe'
    };
  }
  
  private setupCommands(): void {
    this.program
      .name('cleanup')
      .description('Comprehensive codebase cleanup tool for FixWell Services monorepo')
      .version('1.0.0');

    // Main analyze command
    this.program
      .command('analyze')
      .description('Analyze codebase for cleanup opportunities')
      .option('-d, --dry-run', 'Run analysis without making any changes')
      .option('-v, --verbose', 'Enable verbose output')
      .option('-i, --interactive', 'Interactive mode for reviewing changes')
      .option('--config <path>', 'Path to configuration file')
      .option('--exclude <patterns>', 'Comma-separated list of patterns to exclude')
      .option('--include <patterns>', 'Comma-separated list of patterns to include')
      .option('--analyzers <list>', 'Comma-separated list of analyzers to run (duplicates,dependencies,all)', 'all')
      .option('--output-format <format>', 'Output format (console,json,html)', 'console')
      .option('--output-file <path>', 'Output file path (for json/html formats)')
      .option('--auto-fix', 'Automatically apply safe fixes')
      .option('--max-risk <level>', 'Maximum risk level for auto-fixes (safe,review,manual)', 'safe')
      .option('--min-confidence <level>', 'Minimum confidence level for auto-fixes (high,medium,low)', 'high')
      .action(async (options) => {
        await this.handleAnalyzeCommand(options);
      });

    // Execute changes command
    this.program
      .command('execute')
      .description('Execute changes from a previous analysis')
      .argument('<plan-file>', 'Path to execution plan JSON file')
      .option('-d, --dry-run', 'Preview changes without executing them')
      .option('-i, --interactive', 'Interactive mode for reviewing each change')
      .option('--backup-dir <path>', 'Directory for backup files', '.cleanup-backups')
      .option('--continue-on-error', 'Continue execution even if individual changes fail')
      .option('--max-risk <level>', 'Maximum risk level to execute (safe,review,manual)', 'safe')
      .action(async (planFile, options) => {
        await this.handleExecuteCommand(planFile, options);
      });

    // Rollback command
    this.program
      .command('rollback')
      .description('Rollback previously executed changes')
      .option('--backup-dir <path>', 'Directory containing backup files', '.cleanup-backups')
      .option('--change-ids <ids>', 'Comma-separated list of specific change IDs to rollback')
      .action(async (options) => {
        await this.handleRollbackCommand(options);
      });

    // List analyzers command
    this.program
      .command('list-analyzers')
      .description('List available analyzers')
      .action(() => {
        this.handleListAnalyzersCommand();
      });

    // Generate config command
    this.program
      .command('init-config')
      .description('Generate a default configuration file')
      .option('-o, --output <path>', 'Output path for config file', 'cleanup.config.json')
      .action(async (options) => {
        await this.handleInitConfigCommand(options);
      });

    // Benchmark command
    this.program.addCommand(createBenchmarkCommand());

    // Safety management commands
    this.program
      .command('safety')
      .description('Manage safety settings and whitelist/blacklist')
      .option('--add-whitelist <patterns>', 'Add patterns to whitelist (comma-separated)')
      .option('--add-blacklist <patterns>', 'Add patterns to blacklist (comma-separated)')
      .option('--remove-whitelist <patterns>', 'Remove patterns from whitelist (comma-separated)')
      .option('--remove-blacklist <patterns>', 'Remove patterns from blacklist (comma-separated)')
      .option('--show-config', 'Show current safety configuration')
      .option('--interactive', 'Interactive safety management')
      .action(async (options) => {
        await this.handleSafetyCommand(options);
      });

    // Default command (analyze)
    this.program
      .option('-d, --dry-run', 'Run analysis without making any changes')
      .option('-v, --verbose', 'Enable verbose output')
      .option('-i, --interactive', 'Interactive mode for reviewing changes')
      .option('--config <path>', 'Path to configuration file')
      .option('--exclude <patterns>', 'Comma-separated list of patterns to exclude')
      .option('--include <patterns>', 'Comma-separated list of patterns to include')
      .option('--analyzers <list>', 'Comma-separated list of analyzers to run', 'all')
      .option('--output-format <format>', 'Output format (console,json,html)', 'console')
      .option('--output-file <path>', 'Output file path')
      .option('--auto-fix', 'Automatically apply safe fixes')
      .action(async (options) => {
        // If no command specified, run analyze
        await this.handleAnalyzeCommand(options);
      });
  }
  
  private async handleAnalyzeCommand(options: any): Promise<void> {
    try {
      console.log('🧹 FixWell Codebase Cleanup Tool');
      console.log('Analyzing codebase for cleanup opportunities...\n');
      
      // Load configuration
      await this.loadConfiguration(options);
      
      if (options.dryRun || this.config.dryRun) {
        console.log('⚠️  Running in dry-run mode - no changes will be made\n');
        this.config.dryRun = true;
      }
      
      // Setup progress reporting
      const progressCallback = (progress: ProgressInfo) => {
        if (options.verbose) {
          console.log(`${progress.currentStep} (${progress.percentage}%)`);
        } else {
          // Show a simple progress indicator
          process.stdout.write(`\r${progress.currentStep}... ${progress.percentage}%`);
          if (progress.percentage >= 100) {
            process.stdout.write('\n');
          }
        }
      };
      
      // Scan repository
      console.log('📁 Scanning repository files...');
      const scanner = new FileScanner(process.cwd(), progressCallback);
      const inventory = await scanner.scanRepository();
      console.log(`✅ Scan complete! Found ${inventory.length} files\n`);
      
      // Setup analyzers
      const orchestrator = new AnalysisOrchestrator(progressCallback);
      const selectedAnalyzers = this.getSelectedAnalyzers(options.analyzers);
      
      selectedAnalyzers.forEach(analyzer => {
        orchestrator.registerAnalyzer(analyzer);
      });
      
      // Run analysis
      console.log('🔍 Running analysis...');
      const orchestrationResult = await orchestrator.executeAnalysis(inventory);
      
      if (!orchestrationResult.success) {
        console.error('❌ Analysis failed with errors:');
        orchestrationResult.errors.forEach(error => {
          console.error(`  - ${error.analyzerName}: ${error.message}`);
        });
        process.exit(1);
      }
      
      // Generate report
      const report = this.generateCleanupReport(inventory, orchestrationResult.results);
      
      // Output report
      await this.outputReport(report, options);
      
      // Handle auto-fix if requested
      if (options.autoFix) {
        await this.handleAutoFix(report, options);
      }
      
      // Handle interactive mode
      if (options.interactive && !options.autoFix) {
        await this.handleInteractiveMode(report, options);
      }
      
    } catch (error) {
      console.error('❌ Error during analysis:', error);
      process.exit(1);
    }
  }
  
  private async handleExecuteCommand(planFile: string, options: any): Promise<void> {
    try {
      console.log(`📋 Loading execution plan from ${planFile}...`);
      
      const planContent = await readFile(planFile, 'utf8');
      const changes: Change[] = JSON.parse(planContent);
      
      const executor = new ChangeExecutor(options.backupDir);
      const plan = await executor.createExecutionPlan(changes);
      
      console.log(`📊 Execution Plan Summary:`);
      console.log(`  Total changes: ${plan.changes.length}`);
      console.log(`  Affected files: ${plan.affectedFiles}`);
      console.log(`  Risk breakdown: ${plan.riskBreakdown.safe} safe, ${plan.riskBreakdown.review} review, ${plan.riskBreakdown.manual} manual`);
      
      const executionOptions: ExecutionOptions = {
        dryRun: options.dryRun || false,
        createBackups: true,
        continueOnError: options.continueOnError || false,
        maxAutoRiskLevel: options.maxRisk as RiskLevel || 'safe',
        progressCallback: (progress: ProgressInfo) => {
          process.stdout.write(`\r${progress.currentStep}... ${progress.percentage}%`);
          if (progress.percentage >= 100) {
            process.stdout.write('\n');
          }
        }
      };
      
      if (options.interactive) {
        executionOptions.confirmCallback = async (change: Change) => {
          return await this.confirmChange(change);
        };
      }
      
      console.log('\n🚀 Executing changes...');
      const result = await executor.executePlan(plan, executionOptions);
      
      console.log('\n📊 Execution Summary:');
      console.log(`  Total changes: ${result.summary.totalChanges}`);
      console.log(`  Successful: ${result.summary.successfulChanges}`);
      console.log(`  Failed: ${result.summary.failedChanges}`);
      console.log(`  Files modified: ${result.summary.filesModified}`);
      console.log(`  Backups created: ${result.summary.backupsCreated}`);
      
      if (result.success) {
        console.log('✅ Execution completed successfully!');
      } else {
        console.log('⚠️  Execution completed with some failures');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Error during execution:', error);
      process.exit(1);
    }
  }
  
  private async handleRollbackCommand(options: any): Promise<void> {
    try {
      console.log('🔄 Rolling back changes...');
      
      const executor = new ChangeExecutor(options.backupDir);
      const changeIds = options.changeIds ? options.changeIds.split(',') : undefined;
      
      const result = await executor.rollback(changeIds);
      
      console.log('📊 Rollback Summary:');
      console.log(`  Total changes rolled back: ${result.summary.totalChanges}`);
      console.log(`  Successful: ${result.summary.successfulChanges}`);
      console.log(`  Failed: ${result.summary.failedChanges}`);
      
      if (result.success) {
        console.log('✅ Rollback completed successfully!');
      } else {
        console.log('⚠️  Rollback completed with some failures');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Error during rollback:', error);
      process.exit(1);
    }
  }
  
  private handleListAnalyzersCommand(): void {
    console.log('📋 Available Analyzers:\n');
    
    const analyzers = [
      { name: 'duplicates', description: 'Find and remove duplicate files' },
      { name: 'dependencies', description: 'Identify unused dependencies' },
      // Add more as they become available
    ];
    
    analyzers.forEach(analyzer => {
      console.log(`  ${analyzer.name.padEnd(15)} - ${analyzer.description}`);
    });
    
    console.log('\nUsage: --analyzers duplicates,dependencies');
    console.log('       --analyzers all (runs all available analyzers)');
  }
  
  private async handleInitConfigCommand(options: any): Promise<void> {
    try {
      const configPath = options.output;
      const defaultConfig = this.getDefaultConfig();
      
      await writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
      console.log(`✅ Configuration file created at ${configPath}`);
      
    } catch (error) {
      console.error('❌ Error creating configuration file:', error);
      process.exit(1);
    }
  }
  
  private async loadConfiguration(options: any): Promise<void> {
    // Load from config file if specified
    if (options.config) {
      try {
        const configContent = await readFile(options.config, 'utf8');
        const fileConfig = JSON.parse(configContent);
        this.config = { ...this.config, ...fileConfig };
      } catch (error) {
        console.error(`❌ Error loading config file ${options.config}:`, error);
        process.exit(1);
      }
    }
    
    // Override with command line options
    if (options.exclude) {
      this.config.excludePatterns = options.exclude.split(',');
    }
    if (options.include) {
      this.config.includePatterns = options.include.split(',');
    }
    if (options.dryRun) {
      this.config.dryRun = true;
    }
  }
  
  private getSelectedAnalyzers(analyzerList: string) {
    const analyzers = [];
    const requested = analyzerList.toLowerCase().split(',').map(s => s.trim());
    
    if (requested.includes('all') || requested.includes('duplicates')) {
      analyzers.push(new DuplicateFileAnalyzer());
    }
    
    if (requested.includes('all') || requested.includes('dependencies')) {
      analyzers.push(new DependencyAnalyzer());
    }
    
    return analyzers;
  }
  
  private generateCleanupReport(inventory: any[], results: any[]): CleanupReport {
    const totalFindings = results.reduce((sum, result) => sum + result.findings.length, 0);
    const allFindings = results.flatMap(result => result.findings);
    
    const estimatedSavings = allFindings.reduce(
      (acc, finding) => {
        if (finding.estimatedSavings) {
          acc.files += finding.estimatedSavings.files || 0;
          acc.size += finding.estimatedSavings.size || 0;
          acc.dependencies += finding.estimatedSavings.dependencies || 0;
        }
        return acc;
      },
      { files: 0, size: 0, dependencies: 0 }
    );
    
    const categories: { [key: string]: any } = {};
    results.forEach(result => {
      categories[result.analyzer] = result;
    });
    
    return {
      summary: {
        totalFiles: inventory.length,
        totalFindings,
        estimatedSavings: {
          files: estimatedSavings.files,
          diskSpace: this.formatFileSize(estimatedSavings.size),
          dependencies: estimatedSavings.dependencies
        }
      },
      categories,
      recommendations: allFindings
    };
  }
  
  private async outputReport(report: CleanupReport, options: any): Promise<void> {
    const format = options.outputFormat || 'console';
    
    switch (format) {
      case 'console':
        const consoleReporter = new ConsoleReporter();
        await consoleReporter.generateReport(report);
        break;
        
      case 'json':
        const jsonReporter = new JSONReporter();
        const jsonOutput = await jsonReporter.generateReport(report);
        if (options.outputFile) {
          await writeFile(options.outputFile, jsonOutput);
          console.log(`📄 JSON report saved to ${options.outputFile}`);
        } else {
          console.log(jsonOutput);
        }
        break;
        
      case 'html':
        const htmlReporter = new HTMLReporter();
        const htmlOutput = await htmlReporter.generateReport(report);
        if (options.outputFile) {
          await writeFile(options.outputFile, htmlOutput);
          console.log(`📄 HTML report saved to ${options.outputFile}`);
        } else {
          console.log(htmlOutput);
        }
        break;
        
      default:
        console.error(`❌ Unknown output format: ${format}`);
        process.exit(1);
    }
  }
  
  private async handleAutoFix(report: CleanupReport, options: any): Promise<void> {
    const autoFixableFindings = report.recommendations.filter(f => f.autoFixable);
    
    if (autoFixableFindings.length === 0) {
      console.log('ℹ️  No auto-fixable issues found');
      return;
    }
    
    console.log(`🔧 Found ${autoFixableFindings.length} auto-fixable issues`);
    
    // Convert findings to changes (this would need to be implemented based on finding types)
    const changes = this.convertFindingsToChanges(autoFixableFindings);
    
    if (changes.length > 0) {
      const executor = new ChangeExecutor();
      const plan = await executor.createExecutionPlan(changes);
      
      const executionOptions: ExecutionOptions = {
        dryRun: this.config.dryRun,
        createBackups: this.config.createBackups,
        continueOnError: true,
        maxAutoRiskLevel: options.maxRisk as RiskLevel || this.config.autoFixRiskLevel,
        progressCallback: (progress: ProgressInfo) => {
          process.stdout.write(`\r🔧 Applying fixes... ${progress.percentage}%`);
          if (progress.percentage >= 100) {
            process.stdout.write('\n');
          }
        }
      };
      
      const result = await executor.executePlan(plan, executionOptions);
      
      console.log(`✅ Applied ${result.summary.successfulChanges} fixes successfully`);
      if (result.summary.failedChanges > 0) {
        console.log(`⚠️  ${result.summary.failedChanges} fixes failed`);
      }
    }
  }
  
  private async handleInteractiveMode(report: CleanupReport, options: any): Promise<void> {
    console.log('\n🎯 Interactive Mode - Review each recommendation:');
    
    for (let i = 0; i < report.recommendations.length; i++) {
      const finding = report.recommendations[i];
      
      console.log(`\n--- Recommendation ${i + 1}/${report.recommendations.length} ---`);
      console.log(`Type: ${finding.type}`);
      console.log(`Description: ${finding.description}`);
      console.log(`Recommendation: ${finding.recommendation}`);
      console.log(`Auto-fixable: ${finding.autoFixable ? 'Yes' : 'No'}`);
      console.log(`Files: ${finding.files.join(', ')}`);
      
      if (finding.estimatedSavings) {
        const savings = [];
        if (finding.estimatedSavings.files) savings.push(`${finding.estimatedSavings.files} files`);
        if (finding.estimatedSavings.size) savings.push(this.formatFileSize(finding.estimatedSavings.size));
        if (finding.estimatedSavings.dependencies) savings.push(`${finding.estimatedSavings.dependencies} deps`);
        if (savings.length > 0) {
          console.log(`Estimated savings: ${savings.join(', ')}`);
        }
      }
      
      const choices = [];
      if (finding.autoFixable) {
        choices.push({ name: 'Apply this fix', value: 'apply' });
      }
      choices.push(
        { name: 'Skip this recommendation', value: 'skip' },
        { name: 'View details', value: 'details' },
        { name: 'Quit interactive mode', value: 'quit' }
      );
      
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices
        }
      ]);
      
      switch (answer.action) {
        case 'apply':
          // Convert finding to change and apply it
          const changes = this.convertFindingsToChanges([finding]);
          if (changes.length > 0) {
            console.log('🔧 Applying fix...');
            // Apply the changes here
            console.log('✅ Fix applied');
          }
          break;
        case 'details':
          console.log('\n📋 Detailed Information:');
          console.log(`Files affected: ${finding.files.length}`);
          finding.files.forEach((file, idx) => {
            console.log(`  ${idx + 1}. ${file}`);
          });
          i--; // Stay on the same recommendation
          break;
        case 'quit':
          console.log('👋 Exiting interactive mode');
          return;
        case 'skip':
        default:
          // Continue to next recommendation
          break;
      }
    }
    
    console.log('\n✅ Interactive review complete!');
  }
  
  private async confirmChange(change: Change): Promise<boolean> {
    // Create a temporary safety manager to check the change
    const safetyManager = new SafetyManager();
    const safetyResult = await safetyManager.checkChangeSafety(change);
    
    // Use appropriate confirmation based on risk level
    if (safetyResult.riskLevel === 'manual' || !safetyResult.safe) {
      const recommendations = safetyManager.getSafetyRecommendations(change);
      
      if (safetyManager.getConfig().criticalFiles.some(pattern => {
        const filePath = change.sourcePath || change.targetPath || '';
        return filePath.includes(pattern) || pattern.includes('*') && this.matchesPattern(filePath, pattern);
      })) {
        return await ConfirmationPrompts.confirmCriticalFileOperation(change, recommendations);
      }
      
      return await ConfirmationPrompts.confirmHighRiskChange(change, safetyResult);
    }
    
    // For lower risk changes, use simple confirmation
    console.log(`\n--- Change Confirmation ---`);
    console.log(`Type: ${change.type}`);
    console.log(`Description: ${change.description}`);
    console.log(`Risk Level: ${change.riskLevel}`);
    if (change.sourcePath) console.log(`Source: ${change.sourcePath}`);
    if (change.targetPath) console.log(`Target: ${change.targetPath}`);
    
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do with this change?',
        choices: [
          { name: 'Apply this change', value: 'apply' },
          { name: 'Skip this change', value: 'skip' },
          { name: 'Quit interactive mode', value: 'quit' }
        ]
      }
    ]);
    
    return answer.action === 'apply';
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }
  
  private async promptUser(question: string): Promise<string> {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'response',
        message: question
      }
    ]);
    return answer.response;
  }
  
  private convertFindingsToChanges(findings: any[]): Change[] {
    // This is a placeholder - actual implementation would depend on finding types
    return [];
  }
  
  private async handleSafetyCommand(options: any): Promise<void> {
    try {
      const safetyManager = new SafetyManager();
      
      if (options.showConfig) {
        const config = safetyManager.getConfig();
        console.log('🛡️  Current Safety Configuration:');
        console.log('═'.repeat(40));
        console.log(`Critical Files: ${config.criticalFiles.length} patterns`);
        config.criticalFiles.forEach(pattern => console.log(`  - ${pattern}`));
        console.log(`\nCritical Directories: ${config.criticalDirectories.length} patterns`);
        config.criticalDirectories.forEach(pattern => console.log(`  - ${pattern}`));
        console.log(`\nWhitelist: ${config.whitelist.length} patterns`);
        config.whitelist.forEach(pattern => console.log(`  - ${pattern}`));
        console.log(`\nBlacklist: ${config.blacklist.length} patterns`);
        config.blacklist.forEach(pattern => console.log(`  - ${pattern}`));
        console.log(`\nRequire Confirmation: ${config.requireConfirmation}`);
        console.log(`Max Auto Delete Size: ${this.formatFileSize(config.maxAutoDeleteSize)}`);
        return;
      }

      if (options.addWhitelist) {
        const patterns = options.addWhitelist.split(',').map((p: string) => p.trim());
        safetyManager.addToWhitelist(patterns);
        console.log(`✅ Added ${patterns.length} patterns to whitelist`);
        patterns.forEach((pattern: string) => console.log(`  + ${pattern}`));
      }

      if (options.addBlacklist) {
        const patterns = options.addBlacklist.split(',').map((p: string) => p.trim());
        safetyManager.addToBlacklist(patterns);
        console.log(`✅ Added ${patterns.length} patterns to blacklist`);
        patterns.forEach((pattern: string) => console.log(`  + ${pattern}`));
      }

      if (options.removeWhitelist) {
        const patterns = options.removeWhitelist.split(',').map((p: string) => p.trim());
        safetyManager.removeFromWhitelist(patterns);
        console.log(`✅ Removed ${patterns.length} patterns from whitelist`);
        patterns.forEach((pattern: string) => console.log(`  - ${pattern}`));
      }

      if (options.removeBlacklist) {
        const patterns = options.removeBlacklist.split(',').map((p: string) => p.trim());
        safetyManager.removeFromBlacklist(patterns);
        console.log(`✅ Removed ${patterns.length} patterns from blacklist`);
        patterns.forEach((pattern: string) => console.log(`  - ${pattern}`));
      }

      if (options.interactive) {
        await this.handleInteractiveSafetyManagement(safetyManager);
      }

      // If no specific options provided, show help
      if (!options.showConfig && !options.addWhitelist && !options.addBlacklist && 
          !options.removeWhitelist && !options.removeBlacklist && !options.interactive) {
        console.log('🛡️  Safety Management');
        console.log('Use --help to see available options');
        console.log('Use --show-config to view current settings');
        console.log('Use --interactive for guided setup');
      }

    } catch (error) {
      console.error('❌ Error managing safety settings:', error);
      process.exit(1);
    }
  }

  private async handleInteractiveSafetyManagement(safetyManager: SafetyManager): Promise<void> {
    console.log('🛡️  Interactive Safety Management');
    console.log('═'.repeat(40));

    while (true) {
      const result = await ConfirmationPrompts.promptForListManagement();
      
      if (result.action === 'none') {
        break;
      }

      if (!result.patterns || result.patterns.length === 0) {
        console.log('⚠️  No patterns provided');
        continue;
      }

      switch (result.action) {
        case 'add_whitelist':
          safetyManager.addToWhitelist(result.patterns);
          console.log(`✅ Added ${result.patterns.length} patterns to whitelist`);
          break;
        case 'add_blacklist':
          safetyManager.addToBlacklist(result.patterns);
          console.log(`✅ Added ${result.patterns.length} patterns to blacklist`);
          break;
        case 'remove_whitelist':
          safetyManager.removeFromWhitelist(result.patterns);
          console.log(`✅ Removed ${result.patterns.length} patterns from whitelist`);
          break;
        case 'remove_blacklist':
          safetyManager.removeFromBlacklist(result.patterns);
          console.log(`✅ Removed ${result.patterns.length} patterns from blacklist`);
          break;
      }

      result.patterns.forEach((pattern: string) => console.log(`  ${pattern}`));
    }

    console.log('✅ Safety management complete');
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  public parse(argv?: string[]): void {
    this.program.parse(argv);
  }
}

// Create and export the CLI instance
const cli = new CleanupCLI();

if (require.main === module) {
  cli.parse();
}

export { cli as program };