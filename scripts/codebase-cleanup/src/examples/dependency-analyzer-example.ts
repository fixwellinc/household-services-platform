#!/usr/bin/env node

/**
 * Example script demonstrating the DependencyAnalyzer
 * 
 * This script shows how to use the DependencyAnalyzer to find unused dependencies
 * and misplaced dev/prod dependencies in a monorepo structure.
 * 
 * Usage: npm run example:dependency-analyzer
 */

import * as path from 'path';
import { FileScanner } from '../core/FileScanner';
import { DependencyAnalyzer } from '../analyzers/DependencyAnalyzer';

async function main() {
  console.log('🔍 Dependency Analyzer Example');
  console.log('==============================\n');

  try {
    // Scan the current project (go up to the monorepo root)
    const projectRoot = path.resolve(__dirname, '../../../../..');
    console.log(`📁 Scanning project: ${projectRoot}\n`);

    // Initialize the file scanner and dependency analyzer
    const scanner = new FileScanner(projectRoot, (progress) => {
      if (progress.percentage % 20 === 0) {
        console.log(`   📊 Scanning: ${progress.percentage}% - ${progress.currentStep}`);
      }
    });
    const analyzer = new DependencyAnalyzer();

    // Scan all files in the project
    const inventory = await scanner.scanRepository();

    console.log(`\n✅ Scanned ${inventory.length} files\n`);

    // Analyze dependencies
    console.log('🔬 Analyzing dependencies...\n');
    
    const result = await analyzer.analyze(inventory, (progress) => {
      if (progress.percentage % 25 === 0) {
        console.log(`   📊 Analysis: ${progress.percentage}% - ${progress.currentStep}`);
      }
    });

    // Display results
    console.log('\n📋 Analysis Results');
    console.log('==================\n');

    console.log(`Analyzer: ${result.analyzer}`);
    console.log(`Confidence: ${result.confidence}`);
    console.log(`Risk Level: ${result.riskLevel}`);
    console.log(`Total Findings: ${result.findings.length}\n`);

    if (result.findings.length === 0) {
      console.log('🎉 No dependency issues found! Your dependencies are well-organized.\n');
      return;
    }

    // Group findings by type
    const findingsByType = result.findings.reduce((acc, finding) => {
      if (!acc[finding.type]) {
        acc[finding.type] = [];
      }
      acc[finding.type].push(finding);
      return acc;
    }, {} as Record<string, typeof result.findings>);

    // Display unused dependencies
    if (findingsByType.unused) {
      console.log('🗑️  Unused Dependencies');
      console.log('----------------------');
      
      for (const finding of findingsByType.unused) {
        console.log(`\n📦 ${finding.files[0]}`);
        console.log(`   ${finding.description}`);
        console.log(`   💡 ${finding.recommendation}`);
        
        if (finding.estimatedSavings?.dependencies) {
          console.log(`   💰 Savings: ${finding.estimatedSavings.dependencies} dependencies`);
        }
      }
      console.log();
    }

    // Display misplaced dependencies
    if (findingsByType.inconsistent) {
      console.log('🔄 Misplaced Dependencies');
      console.log('-------------------------');
      
      for (const finding of findingsByType.inconsistent) {
        console.log(`\n📦 ${finding.files[0]}`);
        console.log(`   ${finding.description}`);
        console.log(`   💡 ${finding.recommendation}`);
      }
      console.log();
    }

    // Summary statistics
    const totalUnusedDeps = findingsByType.unused?.reduce((sum, finding) => 
      sum + (finding.estimatedSavings?.dependencies || 0), 0) || 0;
    
    const totalMisplacedDeps = findingsByType.inconsistent?.length || 0;

    console.log('📊 Summary');
    console.log('----------');
    console.log(`Unused dependencies: ${totalUnusedDeps}`);
    console.log(`Misplaced dependencies: ${totalMisplacedDeps}`);
    console.log(`Total issues: ${result.findings.length}\n`);

    // Recommendations
    console.log('💡 Recommendations');
    console.log('------------------');
    console.log('1. Review unused dependencies carefully before removing');
    console.log('2. Check if dependencies are used in build scripts or configuration');
    console.log('3. Consider if dependencies are needed for runtime vs development');
    console.log('4. Test thoroughly after making dependency changes');
    console.log('5. Update package-lock.json after removing dependencies\n');

    // Example commands
    if (totalUnusedDeps > 0) {
      console.log('🔧 Example Commands');
      console.log('------------------');
      console.log('# Remove unused dependencies:');
      console.log('npm uninstall <package-name>');
      console.log('# Or for specific workspace:');
      console.log('npm uninstall <package-name> --workspace=apps/frontend\n');
    }

    if (totalMisplacedDeps > 0) {
      console.log('# Move misplaced dependencies:');
      console.log('npm uninstall <package-name> && npm install --save-dev <package-name>');
      console.log('# Or vice versa for dev to prod:');
      console.log('npm uninstall <package-name> && npm install --save <package-name>\n');
    }

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };