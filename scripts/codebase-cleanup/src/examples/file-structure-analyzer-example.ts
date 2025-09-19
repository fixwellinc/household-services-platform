#!/usr/bin/env node

/**
 * Example usage of FileStructureAnalyzer
 * 
 * This example demonstrates how to use the FileStructureAnalyzer to identify
 * naming convention inconsistencies and directory structure issues in a codebase.
 */

import { FileStructureAnalyzer } from '../analyzers/FileStructureAnalyzer';
import { FileScanner } from '../core/FileScanner';
import { ProgressInfo } from '../types';
import * as path from 'path';

async function runFileStructureAnalysis() {
  console.log('🔍 File Structure Analysis Example');
  console.log('=====================================\n');

  // Initialize the analyzer and scanner
  const analyzer = new FileStructureAnalyzer();
  const scanner = new FileScanner();

  // Define the directory to analyze (current project root)
  const projectRoot = path.resolve(__dirname, '../../../..');
  
  console.log(`📁 Analyzing project: ${projectRoot}`);
  console.log(`📊 Analyzer: ${analyzer.description}\n`);

  try {
    // Step 1: Scan the file system
    console.log('Step 1: Scanning file system...');
    const inventory = await scanner.scan(projectRoot, (progress) => {
      process.stdout.write(`\r📂 Scanning: ${progress.percentage}% (${progress.currentStep})`);
    });
    console.log(`\n✅ Found ${inventory.length} files\n`);

    // Step 2: Run file structure analysis
    console.log('Step 2: Analyzing file structure and naming conventions...');
    
    const progressCallback = (progress: ProgressInfo) => {
      process.stdout.write(`\r🔍 ${progress.currentStep}: ${progress.percentage}%`);
    };

    const result = await analyzer.analyze(inventory, progressCallback);
    console.log('\n✅ Analysis complete!\n');

    // Step 3: Display results
    console.log('📋 Analysis Results');
    console.log('==================');
    console.log(`Analyzer: ${result.analyzer}`);
    console.log(`Confidence: ${result.confidence}`);
    console.log(`Risk Level: ${result.riskLevel}`);
    console.log(`Total Findings: ${result.findings.length}\n`);

    if (result.findings.length === 0) {
      console.log('🎉 No file structure issues found! Your codebase follows consistent conventions.');
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

    // Display findings by category
    for (const [type, findings] of Object.entries(findingsByType)) {
      console.log(`\n📌 ${type.toUpperCase()} Issues (${findings.length})`);
      console.log('─'.repeat(50));

      findings.forEach((finding, index) => {
        console.log(`\n${index + 1}. ${finding.description}`);
        console.log(`   📁 Files: ${finding.files.length} file(s)`);
        
        // Show first few files if there are many
        const filesToShow = finding.files.slice(0, 3);
        filesToShow.forEach(file => {
          console.log(`      • ${file}`);
        });
        
        if (finding.files.length > 3) {
          console.log(`      ... and ${finding.files.length - 3} more`);
        }
        
        console.log(`   💡 Recommendation: ${finding.recommendation}`);
        console.log(`   🔧 Auto-fixable: ${finding.autoFixable ? 'Yes' : 'No'}`);
        
        if (finding.estimatedSavings) {
          const savings = finding.estimatedSavings;
          if (savings.files) {
            console.log(`   💾 Estimated savings: ${savings.files} files`);
          }
          if (savings.size) {
            console.log(`   💾 Disk space: ${formatBytes(savings.size)}`);
          }
        }
      });
    }

    // Summary and recommendations
    console.log('\n📊 Summary');
    console.log('==========');
    
    const autoFixableCount = result.findings.filter(f => f.autoFixable).length;
    const manualCount = result.findings.length - autoFixableCount;
    
    console.log(`Total issues found: ${result.findings.length}`);
    console.log(`Auto-fixable: ${autoFixableCount}`);
    console.log(`Require manual review: ${manualCount}`);
    
    const totalFiles = result.findings.reduce((sum, f) => sum + (f.estimatedSavings?.files || 0), 0);
    const totalSize = result.findings.reduce((sum, f) => sum + (f.estimatedSavings?.size || 0), 0);
    
    if (totalFiles > 0) {
      console.log(`Potential file cleanup: ${totalFiles} files`);
    }
    if (totalSize > 0) {
      console.log(`Potential space savings: ${formatBytes(totalSize)}`);
    }

    console.log('\n🚀 Next Steps');
    console.log('=============');
    console.log('1. Review the findings above');
    console.log('2. Start with auto-fixable issues (if any)');
    console.log('3. Plan manual fixes for naming convention standardization');
    console.log('4. Consider creating coding standards documentation');
    console.log('5. Set up linting rules to prevent future inconsistencies');

    // Show specific recommendations based on findings
    const namingIssues = result.findings.filter(f => 
      f.description.includes('naming') || f.description.includes('Mixed naming')
    );
    
    if (namingIssues.length > 0) {
      console.log('\n📝 Naming Convention Recommendations:');
      console.log('• Establish a consistent naming convention (camelCase, kebab-case, etc.)');
      console.log('• Document the chosen convention in your style guide');
      console.log('• Use ESLint rules to enforce naming conventions');
      console.log('• Consider gradual migration for large codebases');
    }

    const structureIssues = result.findings.filter(f => 
      f.description.includes('directory structure')
    );
    
    if (structureIssues.length > 0) {
      console.log('\n🏗️  Directory Structure Recommendations:');
      console.log('• Standardize directory structures across similar modules');
      console.log('• Create templates for new modules/features');
      console.log('• Document the standard project structure');
      console.log('• Use scaffolding tools to maintain consistency');
    }

    const misplacedIssues = result.findings.filter(f => 
      f.description.includes('wrong directory')
    );
    
    if (misplacedIssues.length > 0) {
      console.log('\n📂 File Organization Recommendations:');
      console.log('• Move test files to __tests__ directories');
      console.log('• Organize utility files in utils directories');
      console.log('• Keep type definitions in types directories');
      console.log('• Update import statements after moving files');
    }

  } catch (error) {
    console.error('\n❌ Error during analysis:', error);
    process.exit(1);
  }
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the example if this file is executed directly
if (require.main === module) {
  runFileStructureAnalysis().catch(console.error);
}

export { runFileStructureAnalysis };