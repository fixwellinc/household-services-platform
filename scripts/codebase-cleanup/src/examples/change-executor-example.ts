#!/usr/bin/env node

/**
 * Example demonstrating the ChangeExecutor functionality
 * 
 * This example shows how to:
 * 1. Create an execution plan from findings
 * 2. Execute changes with different options
 * 3. Handle rollbacks
 * 4. Use progress reporting and confirmation callbacks
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ChangeExecutor } from '../core/ChangeExecutor';
import { Change, ExecutionOptions, Finding } from '../types';

async function main() {
  console.log('🔧 ChangeExecutor Example\n');

  // Create a temporary directory for the example
  const exampleDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'change-executor-example-'));
  console.log(`📁 Working in: ${exampleDir}\n`);

  try {
    await runExample(exampleDir);
  } finally {
    // Clean up
    await fs.promises.rm(exampleDir, { recursive: true, force: true });
    console.log('\n🧹 Cleaned up temporary files');
  }
}

async function runExample(workingDir: string) {
  // Initialize the ChangeExecutor
  const backupDir = path.join(workingDir, '.cleanup-backups');
  const executor = new ChangeExecutor(backupDir);

  // Create some example files to work with
  await setupExampleFiles(workingDir);

  // Example 1: Basic execution with dry-run
  console.log('📋 Example 1: Dry-run execution');
  await demonstrateDryRun(executor, workingDir);

  // Example 2: Actual execution with backups
  console.log('\n📋 Example 2: Actual execution with backups');
  await demonstrateActualExecution(executor, workingDir);

  // Example 3: Rollback functionality
  console.log('\n📋 Example 3: Rollback functionality');
  await demonstrateRollback(executor, workingDir);

  // Example 4: Interactive execution with confirmation
  console.log('\n📋 Example 4: Interactive execution');
  await demonstrateInteractiveExecution(executor, workingDir);

  // Example 5: Progress reporting
  console.log('\n📋 Example 5: Progress reporting');
  await demonstrateProgressReporting(executor, workingDir);

  // Example 6: Error handling
  console.log('\n📋 Example 6: Error handling');
  await demonstrateErrorHandling(executor, workingDir);
}

async function setupExampleFiles(workingDir: string) {
  console.log('🏗️  Setting up example files...');

  // Create some duplicate files
  const srcDir = path.join(workingDir, 'src');
  const backupDir = path.join(workingDir, 'backup');
  await fs.promises.mkdir(srcDir, { recursive: true });
  await fs.promises.mkdir(backupDir, { recursive: true });

  const utilsContent = `
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
  `.trim();

  await fs.promises.writeFile(path.join(srcDir, 'utils.ts'), utilsContent);
  await fs.promises.writeFile(path.join(backupDir, 'utils.ts'), utilsContent); // Duplicate

  // Create a package.json with unused dependencies
  const packageJson = {
    name: 'example-project',
    version: '1.0.0',
    dependencies: {
      'lodash': '^4.17.21',
      'unused-package': '^1.0.0'
    },
    devDependencies: {
      'typescript': '^4.9.0',
      'unused-dev-dep': '^1.0.0'
    }
  };

  await fs.promises.writeFile(
    path.join(workingDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create an obsolete file
  await fs.promises.writeFile(
    path.join(workingDir, 'obsolete.js'),
    'console.log("This file is no longer needed");'
  );

  console.log('✅ Example files created');
}

async function demonstrateDryRun(executor: ChangeExecutor, workingDir: string) {
  const changes: Change[] = [
    {
      id: 'remove-duplicate',
      type: 'delete_file',
      description: 'Remove duplicate utils.ts file',
      sourcePath: path.join(workingDir, 'backup', 'utils.ts'),
      riskLevel: 'safe',
      autoApplicable: true
    },
    {
      id: 'remove-obsolete',
      type: 'delete_file',
      description: 'Remove obsolete JavaScript file',
      sourcePath: path.join(workingDir, 'obsolete.js'),
      riskLevel: 'safe',
      autoApplicable: true
    }
  ];

  const plan = await executor.createExecutionPlan(changes);
  console.log(`   📊 Plan: ${plan.changes.length} changes, ${plan.affectedFiles} files affected`);
  console.log(`   ⚡ Estimated time: ${plan.estimatedTime}ms`);
  console.log(`   🎯 Risk breakdown: ${plan.riskBreakdown.safe} safe, ${plan.riskBreakdown.review} review, ${plan.riskBreakdown.manual} manual`);

  const options: ExecutionOptions = {
    dryRun: true,
    createBackups: false,
    continueOnError: true,
    maxAutoRiskLevel: 'safe'
  };

  const result = await executor.executePlan(plan, options);
  console.log(`   ✅ Dry-run completed: ${result.summary.successfulChanges}/${result.summary.totalChanges} changes validated`);
  console.log(`   ⏱️  Execution time: ${result.executionTime}ms`);
}

async function demonstrateActualExecution(executor: ChangeExecutor, workingDir: string) {
  const duplicateFile = path.join(workingDir, 'backup', 'utils.ts');
  
  const changes: Change[] = [
    {
      id: 'remove-duplicate-actual',
      type: 'delete_file',
      description: 'Remove duplicate utils.ts file',
      sourcePath: duplicateFile,
      riskLevel: 'safe',
      autoApplicable: true
    }
  ];

  const plan = await executor.createExecutionPlan(changes);
  const options: ExecutionOptions = {
    dryRun: false,
    createBackups: true,
    continueOnError: true,
    maxAutoRiskLevel: 'safe'
  };

  console.log(`   🔄 Executing ${plan.changes.length} changes...`);
  const result = await executor.executePlan(plan, options);

  console.log(`   ✅ Execution completed: ${result.summary.successfulChanges}/${result.summary.totalChanges} changes applied`);
  console.log(`   💾 Backups created: ${result.summary.backupsCreated}`);
  console.log(`   📁 Files modified: ${result.summary.filesModified}`);

  // Verify the file was deleted
  const fileExists = await fs.promises.access(duplicateFile).then(() => true).catch(() => false);
  console.log(`   🗑️  File deleted: ${!fileExists ? '✅' : '❌'}`);

  // Show backup information
  if (result.backups.length > 0) {
    console.log(`   💾 Backup created at: ${result.backups[0].backupPath}`);
  }
}

async function demonstrateRollback(executor: ChangeExecutor, workingDir: string) {
  console.log('   🔄 Rolling back previous changes...');
  
  const rollbackResult = await executor.rollback();
  
  console.log(`   ✅ Rollback completed: ${rollbackResult.summary.successfulChanges}/${rollbackResult.summary.totalChanges} changes reverted`);
  console.log(`   ⏱️  Rollback time: ${rollbackResult.executionTime}ms`);

  // Verify the file was restored
  const duplicateFile = path.join(workingDir, 'backup', 'utils.ts');
  const fileExists = await fs.promises.access(duplicateFile).then(() => true).catch(() => false);
  console.log(`   🔄 File restored: ${fileExists ? '✅' : '❌'}`);
}

async function demonstrateInteractiveExecution(executor: ChangeExecutor, workingDir: string) {
  const changes: Change[] = [
    {
      id: 'update-package-json',
      type: 'update_package_json',
      description: 'Remove unused dependencies from package.json',
      sourcePath: path.join(workingDir, 'package.json'),
      content: JSON.stringify({
        name: 'example-project',
        version: '1.0.0',
        dependencies: {
          'lodash': '^4.17.21'
        },
        devDependencies: {
          'typescript': '^4.9.0'
        }
      }),
      riskLevel: 'review',
      autoApplicable: true
    }
  ];

  const plan = await executor.createExecutionPlan(changes);
  
  // Simulate user confirmation (in real usage, this would be interactive)
  let confirmationCount = 0;
  const options: ExecutionOptions = {
    dryRun: false,
    createBackups: true,
    continueOnError: true,
    maxAutoRiskLevel: 'review',
    confirmCallback: async (change) => {
      confirmationCount++;
      console.log(`   ❓ Confirm change: ${change.description}`);
      console.log(`   📊 Risk level: ${change.riskLevel}`);
      console.log(`   ✅ Auto-confirmed (in real usage, user would be prompted)`);
      return true; // Auto-confirm for demo
    }
  };

  const result = await executor.executePlan(plan, options);
  
  console.log(`   ✅ Interactive execution completed`);
  console.log(`   ❓ Confirmations requested: ${confirmationCount}`);
  console.log(`   ✅ Changes applied: ${result.summary.successfulChanges}`);
}

async function demonstrateProgressReporting(executor: ChangeExecutor, workingDir: string) {
  const changes: Change[] = [
    {
      id: 'create-file-1',
      type: 'create_file',
      description: 'Create new feature file 1',
      targetPath: path.join(workingDir, 'feature1.ts'),
      content: 'export class Feature1 {}',
      riskLevel: 'safe',
      autoApplicable: true
    },
    {
      id: 'create-file-2',
      type: 'create_file',
      description: 'Create new feature file 2',
      targetPath: path.join(workingDir, 'feature2.ts'),
      content: 'export class Feature2 {}',
      riskLevel: 'safe',
      autoApplicable: true
    },
    {
      id: 'create-file-3',
      type: 'create_file',
      description: 'Create new feature file 3',
      targetPath: path.join(workingDir, 'feature3.ts'),
      content: 'export class Feature3 {}',
      riskLevel: 'safe',
      autoApplicable: true
    }
  ];

  const plan = await executor.createExecutionPlan(changes);
  
  const progressUpdates: any[] = [];
  const options: ExecutionOptions = {
    dryRun: false,
    createBackups: false,
    continueOnError: true,
    maxAutoRiskLevel: 'safe',
    progressCallback: (progress) => {
      progressUpdates.push(progress);
      console.log(`   📊 Progress: ${progress.percentage}% - ${progress.currentStep}`);
      if (progress.details) {
        console.log(`      ℹ️  ${progress.details}`);
      }
    }
  };

  const result = await executor.executePlan(plan, options);
  
  console.log(`   ✅ Progress reporting completed`);
  console.log(`   📊 Progress updates received: ${progressUpdates.length}`);
  console.log(`   ✅ Files created: ${result.summary.filesModified}`);
}

async function demonstrateErrorHandling(executor: ChangeExecutor, workingDir: string) {
  const changes: Change[] = [
    {
      id: 'delete-nonexistent',
      type: 'delete_file',
      description: 'Try to delete non-existent file',
      sourcePath: path.join(workingDir, 'nonexistent.txt'),
      riskLevel: 'safe',
      autoApplicable: true
    },
    {
      id: 'create-valid-file',
      type: 'create_file',
      description: 'Create a valid file',
      targetPath: path.join(workingDir, 'valid.txt'),
      content: 'This should work',
      riskLevel: 'safe',
      autoApplicable: true
    }
  ];

  const plan = await executor.createExecutionPlan(changes);
  
  const options: ExecutionOptions = {
    dryRun: false,
    createBackups: false,
    continueOnError: true, // Continue despite errors
    maxAutoRiskLevel: 'safe'
  };

  console.log(`   🔄 Executing plan with potential errors...`);
  const result = await executor.executePlan(plan, options);
  
  console.log(`   ✅ Error handling completed`);
  console.log(`   ✅ Successful changes: ${result.summary.successfulChanges}`);
  console.log(`   ❌ Failed changes: ${result.summary.failedChanges}`);
  console.log(`   🔄 Continued execution: ${result.summary.successfulChanges > 0 ? '✅' : '❌'}`);

  // Show error details
  const failedResults = result.changeResults.filter(r => !r.success);
  if (failedResults.length > 0) {
    console.log(`   ❌ Error details:`);
    failedResults.forEach(r => {
      console.log(`      - ${r.change.description}: ${r.error}`);
    });
  }
}

// Utility functions
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main as runChangeExecutorExample };