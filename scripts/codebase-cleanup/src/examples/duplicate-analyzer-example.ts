#!/usr/bin/env ts-node

/**
 * Example script demonstrating how to use the DuplicateFileAnalyzer
 * to find and analyze duplicate files in a codebase
 */

import * as path from 'path';
import { FileScanner } from '../core/FileScanner';
import { DuplicateFileAnalyzer } from '../analyzers/DuplicateFileAnalyzer';

async function main() {
  console.log('🔍 Duplicate File Analysis Example');
  console.log('==================================\n');

  // Path to analyze (current directory by default)
  const targetPath = process.argv[2] || process.cwd();
  console.log(`Analyzing directory: ${targetPath}\n`);

  try {
    // Step 1: Scan the file system
    console.log('📁 Scanning files...');
    const scanner = new FileScanner(targetPath, (progress) => {
      if (progress.percentage % 25 === 0) {
        console.log(`   ${progress.percentage}% - ${progress.currentStep}`);
      }
    });

    const inventory = await scanner.scanRepository();
    console.log(`   Found ${inventory.length} files\n`);

    // Step 2: Analyze for duplicates
    console.log('🔍 Analyzing for duplicates...');
    const analyzer = new DuplicateFileAnalyzer();
    
    const result = await analyzer.analyze(inventory, (progress) => {
      if (progress.percentage % 25 === 0) {
        console.log(`   ${progress.percentage}% - ${progress.currentStep}`);
      }
    });

    // Step 3: Display results
    console.log('\n📊 Analysis Results');
    console.log('==================');
    console.log(`Analyzer: ${result.analyzer}`);
    console.log(`Confidence: ${result.confidence}`);
    console.log(`Risk Level: ${result.riskLevel}`);
    console.log(`Findings: ${result.findings.length}\n`);

    if (result.findings.length === 0) {
      console.log('✅ No duplicate files found!');
      return;
    }

    // Display findings
    result.findings.forEach((finding, index) => {
      console.log(`Finding ${index + 1}:`);
      console.log(`  Type: ${finding.type}`);
      console.log(`  Description: ${finding.description}`);
      console.log(`  Files involved: ${finding.files.length}`);
      
      finding.files.forEach((file, fileIndex) => {
        console.log(`    ${fileIndex + 1}. ${file}`);
      });
      
      console.log(`  Recommendation: ${finding.recommendation}`);
      console.log(`  Auto-fixable: ${finding.autoFixable ? '✅' : '❌'}`);
      
      if (finding.estimatedSavings) {
        console.log(`  Estimated savings:`);
        if (finding.estimatedSavings.files) {
          console.log(`    Files: ${finding.estimatedSavings.files}`);
        }
        if (finding.estimatedSavings.size) {
          const sizeKB = Math.round(finding.estimatedSavings.size / 1024);
          console.log(`    Disk space: ${sizeKB} KB`);
        }
      }
      
      console.log('');
    });

    // Summary
    const totalFilesToRemove = result.findings.reduce((sum, f) => 
      sum + (f.estimatedSavings?.files || 0), 0
    );
    const totalSizeToSave = result.findings.reduce((sum, f) => 
      sum + (f.estimatedSavings?.size || 0), 0
    );

    console.log('📈 Summary');
    console.log('==========');
    console.log(`Total files that could be removed: ${totalFilesToRemove}`);
    console.log(`Total disk space that could be saved: ${Math.round(totalSizeToSave / 1024)} KB`);
    
    const autoFixableCount = result.findings.filter(f => f.autoFixable).length;
    console.log(`Auto-fixable findings: ${autoFixableCount}/${result.findings.length}`);

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as runDuplicateAnalysisExample };