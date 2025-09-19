/**
 * Example demonstrating the reporting system
 */

import { ConsoleReporter, JSONReporter, HTMLReporter } from '../reporters';
import { CleanupReport } from '../types';

/**
 * Create a sample cleanup report for demonstration
 */
function createSampleReport(): CleanupReport {
  return {
    summary: {
      totalFiles: 2847,
      totalFindings: 42,
      estimatedSavings: {
        files: 18,
        diskSpace: '12.3 MB',
        dependencies: 7
      }
    },
    categories: {
      'Duplicate File Analyzer': {
        analyzer: 'Duplicate File Analyzer',
        findings: [
          {
            type: 'duplicate',
            files: [
              'apps/frontend/src/utils/formatters.ts',
              'packages/shared/src/formatters.ts'
            ],
            description: 'Duplicate formatter utilities found',
            recommendation: 'Consolidate into packages/shared and update imports',
            autoFixable: true,
            estimatedSavings: { files: 1, size: 3072 }
          },
          {
            type: 'duplicate',
            files: [
              'apps/frontend/src/constants/api.ts',
              'apps/backend/src/constants/api.ts'
            ],
            description: 'Duplicate API constants',
            recommendation: 'Move to shared package',
            autoFixable: false,
            estimatedSavings: { files: 1, size: 1024 }
          }
        ],
        confidence: 'high',
        riskLevel: 'safe'
      },
      'Dependency Analyzer': {
        analyzer: 'Dependency Analyzer',
        findings: [
          {
            type: 'unused',
            files: ['apps/frontend/package.json'],
            description: 'Unused dependencies: moment, underscore',
            recommendation: 'Remove unused dependencies to reduce bundle size',
            autoFixable: true,
            estimatedSavings: { dependencies: 2 }
          }
        ],
        confidence: 'high',
        riskLevel: 'safe'
      },
      'Dead Code Analyzer': {
        analyzer: 'Dead Code Analyzer',
        findings: [
          {
            type: 'obsolete',
            files: ['apps/backend/src/legacy/oldAuth.ts'],
            description: 'Legacy authentication code no longer used',
            recommendation: 'Remove after confirming no external dependencies',
            autoFixable: false,
            estimatedSavings: { files: 1, size: 4096 }
          }
        ],
        confidence: 'medium',
        riskLevel: 'review'
      }
    },
    recommendations: []
  };
}

/**
 * Demonstrate all three reporters
 */
async function demonstrateReporters() {
  const report = createSampleReport();
  
  // Populate recommendations from categories
  report.recommendations = Object.values(report.categories)
    .flatMap(category => category.findings);

  console.log('🧹 Codebase Cleanup Reporting System Demo\n');

  // Console Reporter
  console.log('📊 Console Report:');
  console.log('=' .repeat(50));
  const consoleReporter = new ConsoleReporter();
  await consoleReporter.generateReport(report);

  console.log('\n📄 JSON Report Generated');
  console.log('=' .repeat(50));
  const jsonReporter = new JSONReporter();
  const jsonOutput = await jsonReporter.generateReport(report);
  console.log('JSON report size:', jsonOutput.length, 'characters');
  console.log('Sample JSON structure:');
  const jsonSample = JSON.parse(jsonOutput);
  console.log('- Metadata:', Object.keys(jsonSample.metadata));
  console.log('- Statistics:', Object.keys(jsonSample.statistics));
  console.log('- Validation:', jsonSample.validation.isValid ? '✅ Valid' : '❌ Invalid');

  console.log('\n🌐 HTML Report Generated');
  console.log('=' .repeat(50));
  const htmlReporter = new HTMLReporter();
  const htmlOutput = await htmlReporter.generateReport(report);
  console.log('HTML report size:', htmlOutput.length, 'characters');
  console.log('Contains CSS:', htmlOutput.includes('<style>') ? '✅ Yes' : '❌ No');
  console.log('Contains JavaScript:', htmlOutput.includes('<script>') ? '✅ Yes' : '❌ No');
  console.log('Interactive elements:', htmlOutput.includes('addEventListener') ? '✅ Yes' : '❌ No');

  // Demonstrate file output
  console.log('\n💾 File Output Demo');
  console.log('=' .repeat(50));
  
  try {
    await jsonReporter.generateReport(report, 'sample-report.json');
    console.log('✅ JSON report saved to sample-report.json');
  } catch (error) {
    console.log('❌ Failed to save JSON report:', error instanceof Error ? error.message : 'Unknown error');
  }

  try {
    await htmlReporter.generateReport(report, 'sample-report.html');
    console.log('✅ HTML report saved to sample-report.html');
  } catch (error) {
    console.log('❌ Failed to save HTML report:', error instanceof Error ? error.message : 'Unknown error');
  }

  console.log('\n🎯 Summary');
  console.log('=' .repeat(50));
  console.log('✅ ConsoleReporter: Terminal-friendly output with colors');
  console.log('✅ JSONReporter: Machine-readable format with validation');
  console.log('✅ HTMLReporter: Interactive web report with styling');
  console.log('\nAll reporters support the same CleanupReport interface and can be used interchangeably.');
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateReporters().catch(console.error);
}

export { demonstrateReporters, createSampleReport };