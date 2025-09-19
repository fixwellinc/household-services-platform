#!/usr/bin/env tsx

/**
 * Example script demonstrating the ConfigurationAnalyzer
 * 
 * This script shows how to use the ConfigurationAnalyzer to:
 * 1. Identify duplicate configuration files
 * 2. Detect conflicting settings across environments
 * 3. Find consolidation opportunities
 * 4. Generate actionable recommendations
 * 
 * Usage:
 *   npm run example:configuration-analyzer
 *   tsx src/examples/configuration-analyzer-example.ts
 */

import { ConfigurationAnalyzer } from '../analyzers/ConfigurationAnalyzer';
import { FileScanner } from '../core/FileScanner';
import { ProgressInfo } from '../types';
import * as path from 'path';

async function runConfigurationAnalysisExample() {
  console.log('🔧 Configuration Analyzer Example');
  console.log('=====================================\n');

  // Initialize the analyzer
  const analyzer = new ConfigurationAnalyzer();

  // Define the project root (go up from scripts/codebase-cleanup to project root)
  const projectRoot = path.resolve(__dirname, '../../../..');
  
  console.log(`📁 Scanning project directory: ${projectRoot}`);
  console.log(`🔍 Analyzer: ${analyzer.name}`);
  console.log(`📝 Description: ${analyzer.description}\n`);

  try {
    // Step 1: Scan the project for files
    console.log('Step 1: Scanning files...');
    const scanner = new FileScanner(projectRoot);
    const inventory = await scanner.scanRepository();

    console.log(`✅ Found ${inventory.length} files\n`);

    // Step 2: Estimate analysis time
    const estimatedTime = analyzer.getEstimatedTime(inventory.length);
    console.log(`⏱️  Estimated analysis time: ${estimatedTime}ms\n`);

    // Step 3: Run the analysis with progress reporting
    console.log('Step 2: Analyzing configuration files...');
    
    let lastProgress = 0;
    const progressCallback = (progress: ProgressInfo) => {
      if (progress.percentage >= lastProgress + 10) {
        console.log(`   ${progress.percentage}% - ${progress.currentStep}`);
        lastProgress = progress.percentage;
      }
    };

    const startTime = Date.now();
    const result = await analyzer.analyze(inventory, progressCallback);
    const analysisTime = Date.now() - startTime;

    console.log(`✅ Analysis completed in ${analysisTime}ms\n`);

    // Step 4: Display results
    console.log('📊 Analysis Results');
    console.log('==================');
    console.log(`Analyzer: ${result.analyzer}`);
    console.log(`Confidence: ${result.confidence}`);
    console.log(`Risk Level: ${result.riskLevel}`);
    console.log(`Total Findings: ${result.findings.length}\n`);

    if (result.findings.length === 0) {
      console.log('🎉 No configuration issues found! Your configuration files are well organized.\n');
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
      console.log(`\n${getTypeIcon(type)} ${type.toUpperCase()} (${findings.length} issues)`);
      console.log('─'.repeat(50));

      findings.forEach((finding, index) => {
        console.log(`\n${index + 1}. ${finding.description}`);
        console.log(`   📁 Files: ${finding.files.join(', ')}`);
        console.log(`   💡 Recommendation: ${finding.recommendation}`);
        console.log(`   🔧 Auto-fixable: ${finding.autoFixable ? 'Yes' : 'No'}`);
        
        if (finding.estimatedSavings) {
          const savings = [];
          if (finding.estimatedSavings.files) {
            savings.push(`${finding.estimatedSavings.files} files`);
          }
          if (finding.estimatedSavings.size) {
            savings.push(`${formatBytes(finding.estimatedSavings.size)} disk space`);
          }
          if (finding.estimatedSavings.dependencies) {
            savings.push(`${finding.estimatedSavings.dependencies} dependencies`);
          }
          
          if (savings.length > 0) {
            console.log(`   💾 Potential savings: ${savings.join(', ')}`);
          }
        }
      });
    }

    // Step 5: Summary and recommendations
    console.log('\n\n📋 Summary & Next Steps');
    console.log('========================');

    const totalFiles = result.findings.reduce((sum, f) => 
      sum + (f.estimatedSavings?.files || 0), 0
    );
    const totalSize = result.findings.reduce((sum, f) => 
      sum + (f.estimatedSavings?.size || 0), 0
    );

    if (totalFiles > 0 || totalSize > 0) {
      console.log('💾 Potential Savings:');
      if (totalFiles > 0) {
        console.log(`   • ${totalFiles} files could be removed or consolidated`);
      }
      if (totalSize > 0) {
        console.log(`   • ${formatBytes(totalSize)} of disk space could be freed`);
      }
    }

    console.log('\n🎯 Recommended Actions:');
    
    const autoFixableCount = result.findings.filter(f => f.autoFixable).length;
    const manualCount = result.findings.length - autoFixableCount;

    if (autoFixableCount > 0) {
      console.log(`   1. ${autoFixableCount} issues can be automatically fixed`);
    }
    if (manualCount > 0) {
      console.log(`   2. ${manualCount} issues require manual review and resolution`);
    }

    console.log('\n⚠️  Important Notes:');
    console.log('   • Always backup your configuration files before making changes');
    console.log('   • Test configuration changes in a development environment first');
    console.log('   • Review environment-specific settings carefully');
    console.log('   • Consider the impact on different deployment environments');

    // Step 6: Configuration-specific recommendations
    console.log('\n🔧 Configuration Best Practices:');
    console.log('   • Use a single root .env file for shared settings');
    console.log('   • Keep environment-specific settings in separate files');
    console.log('   • Use TypeScript configuration inheritance with "extends"');
    console.log('   • Consolidate common compiler options in a base tsconfig.json');
    console.log('   • Document any intentional configuration differences');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

/**
 * Get an icon for the finding type
 */
function getTypeIcon(type: string): string {
  switch (type) {
    case 'duplicate': return '📋';
    case 'inconsistent': return '⚠️';
    case 'unused': return '🗑️';
    case 'obsolete': return '📜';
    default: return '🔍';
  }
}

/**
 * Format bytes into human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Run the example if this file is executed directly
if (require.main === module) {
  runConfigurationAnalysisExample().catch(console.error);
}

export { runConfigurationAnalysisExample };