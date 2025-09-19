import { AnalysisOrchestrator, FileScanner, MockAnalyzer } from '../core';
import { ProgressInfo } from '../types';

/**
 * Example demonstrating how to use the AnalysisOrchestrator
 */
async function runOrchestrationExample() {
  console.log('🚀 Starting Codebase Cleanup Analysis Orchestration Example\n');

  // Create progress callback to track orchestration progress
  const progressCallback = (progress: ProgressInfo) => {
    const progressBar = '█'.repeat(Math.floor(progress.percentage / 5)) + 
                       '░'.repeat(20 - Math.floor(progress.percentage / 5));
    
    console.log(
      `[${progressBar}] ${progress.percentage}% - ${progress.currentStep}`
    );
    
    if (progress.details) {
      console.log(`   └─ ${progress.details}`);
    }
  };

  // Initialize the orchestrator with progress reporting
  const orchestrator = new AnalysisOrchestrator(progressCallback);

  // Register multiple analyzers
  console.log('📋 Registering analyzers...');
  orchestrator.registerAnalyzers([
    new MockAnalyzer('duplicate-finder', 'Finds duplicate files in the codebase'),
    new MockAnalyzer('dependency-analyzer', 'Analyzes unused dependencies'),
    new MockAnalyzer('dead-code-detector', 'Detects unused code and functions')
  ]);

  console.log(`✅ Registered ${orchestrator.getRegisteredAnalyzers().length} analyzers:`);
  orchestrator.getAnalyzerInfo().forEach(info => {
    console.log(`   • ${info.name}: ${info.description}`);
  });

  // Scan the codebase
  console.log('\n📁 Scanning codebase...');
  const scanner = new FileScanner(process.cwd(), (scanProgress) => {
    if (scanProgress.percentage % 25 === 0) { // Only log every 25%
      console.log(`   Scanning: ${scanProgress.percentage}% (${scanProgress.details})`);
    }
  });

  const inventory = await scanner.scanRepository();
  console.log(`✅ Found ${inventory.length} files to analyze\n`);

  // Get estimated time
  const estimatedTime = orchestrator.getEstimatedTotalTime(inventory.length);
  console.log(`⏱️  Estimated analysis time: ${Math.round(estimatedTime / 1000)}s\n`);

  // Execute the analysis
  console.log('🔍 Starting analysis orchestration...\n');
  const startTime = Date.now();
  
  const result = await orchestrator.executeAnalysis(inventory);
  
  const actualTime = Date.now() - startTime;

  // Display results
  console.log('\n📊 Analysis Results:');
  console.log('═'.repeat(50));
  
  console.log(`✅ Success: ${result.success}`);
  console.log(`⏱️  Total Time: ${Math.round(actualTime / 1000)}s`);
  console.log(`📈 Analyzers Completed: ${result.results.length}`);
  console.log(`❌ Errors: ${result.errors.length}`);

  if (result.results.length > 0) {
    console.log('\n🔍 Analysis Results:');
    result.results.forEach(analysisResult => {
      console.log(`\n📋 ${analysisResult.analyzer}:`);
      console.log(`   • Confidence: ${analysisResult.confidence}`);
      console.log(`   • Risk Level: ${analysisResult.riskLevel}`);
      console.log(`   • Findings: ${analysisResult.findings.length}`);
      
      analysisResult.findings.forEach((finding, index) => {
        console.log(`   ${index + 1}. ${finding.description}`);
        console.log(`      Files: ${finding.files.length}`);
        console.log(`      Auto-fixable: ${finding.autoFixable ? '✅' : '❌'}`);
        if (finding.estimatedSavings) {
          console.log(`      Savings: ${finding.estimatedSavings.files || 0} files, ${finding.estimatedSavings.size || 0} bytes`);
        }
      });
    });
  }

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(error => {
      console.log(`   • ${error.analyzerName}: ${error.message}`);
      console.log(`     Recoverable: ${error.recoverable ? '✅' : '❌'}`);
    });
  }

  console.log('\n🎉 Orchestration example completed!');
}

// Run the example if this file is executed directly
if (require.main === module) {
  runOrchestrationExample().catch(error => {
    console.error('❌ Example failed:', error);
    process.exit(1);
  });
}

export { runOrchestrationExample };