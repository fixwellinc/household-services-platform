import { DeadCodeAnalyzer } from '../analyzers/DeadCodeAnalyzer';
import { FileScanner } from '../core/FileScanner';
import { FileInventory } from '../types';

/**
 * Example demonstrating how to use the DeadCodeAnalyzer
 * to detect unused code in a TypeScript/JavaScript codebase
 */
async function runDeadCodeAnalysisExample(): Promise<void> {
  console.log('🔍 Dead Code Analysis Example');
  console.log('================================\n');

  // Initialize the analyzer
  const analyzer = new DeadCodeAnalyzer();
  
  // Check if analyzer can run
  const canRun = await analyzer.canRun();
  if (!canRun) {
    console.error('❌ DeadCodeAnalyzer cannot run. TypeScript compiler API not available.');
    return;
  }

  console.log('✅ DeadCodeAnalyzer is ready to run');
  console.log(`📝 Description: ${analyzer.description}\n`);

  // Create a file scanner to get inventory
  const scanner = new FileScanner();
  
  // Scan the current project (you can specify a different path)
  const projectPath = process.cwd();
  console.log(`📂 Scanning project: ${projectPath}`);
  
  const inventory = await scanner.scan(projectPath, (progress) => {
    if (progress.percentage % 20 === 0) {
      console.log(`   📊 Scanning progress: ${progress.percentage}% - ${progress.currentStep}`);
    }
  });

  console.log(`📋 Found ${inventory.length} files in inventory\n`);

  // Filter to show only code files that will be analyzed
  const codeFiles = inventory.filter(file => 
    ['typescript', 'javascript'].includes(file.fileType) &&
    !file.path.includes('node_modules') &&
    !file.path.includes('.d.ts') &&
    !file.path.endsWith('.test.ts') &&
    !file.path.endsWith('.test.js') &&
    !file.path.endsWith('.spec.ts') &&
    !file.path.endsWith('.spec.js')
  );

  console.log(`🎯 Will analyze ${codeFiles.length} TypeScript/JavaScript files:`);
  codeFiles.slice(0, 10).forEach(file => {
    console.log(`   - ${file.path} (${file.fileType})`);
  });
  if (codeFiles.length > 10) {
    console.log(`   ... and ${codeFiles.length - 10} more files`);
  }
  console.log();

  // Estimate analysis time
  const estimatedTime = analyzer.getEstimatedTime(codeFiles.length);
  console.log(`⏱️  Estimated analysis time: ${estimatedTime}ms (${Math.round(estimatedTime / 1000)}s)\n`);

  // Run the analysis with progress reporting
  console.log('🚀 Starting dead code analysis...\n');
  
  const startTime = Date.now();
  const result = await analyzer.analyze(inventory, (progress) => {
    console.log(`   📊 ${progress.currentStep} (${progress.percentage}%)`);
  });
  const endTime = Date.now();

  console.log(`\n✅ Analysis completed in ${endTime - startTime}ms\n`);

  // Display results
  console.log('📊 ANALYSIS RESULTS');
  console.log('==================');
  console.log(`Analyzer: ${result.analyzer}`);
  console.log(`Confidence: ${result.confidence}`);
  console.log(`Risk Level: ${result.riskLevel}`);
  console.log(`Total Findings: ${result.findings.length}\n`);

  if (result.findings.length === 0) {
    console.log('🎉 No dead code detected! Your codebase is clean.');
    return;
  }

  // Group findings by type and auto-fixable status
  const exportedFindings = result.findings.filter(f => 
    f.description.includes('exported') && !f.autoFixable
  );
  const internalFindings = result.findings.filter(f => 
    f.description.includes('internal') && f.autoFixable
  );

  console.log('🔍 DETAILED FINDINGS');
  console.log('===================\n');

  if (exportedFindings.length > 0) {
    console.log('⚠️  EXPORTED UNUSED SYMBOLS (Require Manual Review):');
    exportedFindings.forEach((finding, index) => {
      console.log(`\n${index + 1}. ${finding.description}`);
      console.log(`   📁 Files: ${finding.files.join(', ')}`);
      console.log(`   💡 Recommendation: ${finding.recommendation}`);
      console.log(`   🔧 Auto-fixable: ${finding.autoFixable ? '✅' : '❌'}`);
    });
    console.log();
  }

  if (internalFindings.length > 0) {
    console.log('🔧 INTERNAL UNUSED SYMBOLS (Can be Auto-fixed):');
    internalFindings.forEach((finding, index) => {
      console.log(`\n${index + 1}. ${finding.description}`);
      console.log(`   📁 Files: ${finding.files.join(', ')}`);
      console.log(`   💡 Recommendation: ${finding.recommendation}`);
      console.log(`   🔧 Auto-fixable: ${finding.autoFixable ? '✅' : '❌'}`);
    });
    console.log();
  }

  // Show summary statistics
  console.log('📈 SUMMARY STATISTICS');
  console.log('====================');
  console.log(`Total unused symbols found: ${result.findings.length}`);
  console.log(`Exported symbols (need review): ${exportedFindings.length}`);
  console.log(`Internal symbols (auto-fixable): ${internalFindings.length}`);
  
  const totalFiles = new Set(result.findings.flatMap(f => f.files)).size;
  console.log(`Files with dead code: ${totalFiles}`);
  
  console.log('\n💡 NEXT STEPS');
  console.log('=============');
  console.log('1. Review exported unused symbols carefully - they might be used by external consumers');
  console.log('2. Internal unused symbols can typically be safely removed');
  console.log('3. Consider running tests after removing dead code to ensure nothing breaks');
  console.log('4. Use your IDE\'s "Find Usages" feature to double-check before removing exports');
  
  console.log('\n🎯 EXAMPLE CLEANUP COMMANDS');
  console.log('===========================');
  
  if (internalFindings.length > 0) {
    console.log('# Remove internal unused symbols (review each file):');
    const filesWithInternal = new Set(internalFindings.flatMap(f => f.files));
    filesWithInternal.forEach(file => {
      console.log(`code ${file}  # Review and remove unused internal symbols`);
    });
  }
  
  if (exportedFindings.length > 0) {
    console.log('\n# Review exported unused symbols (be careful):');
    const filesWithExported = new Set(exportedFindings.flatMap(f => f.files));
    filesWithExported.forEach(file => {
      console.log(`code ${file}  # Carefully review unused exports`);
    });
  }
}

/**
 * Example of analyzing a specific subset of files
 */
async function analyzeSpecificFiles(): Promise<void> {
  console.log('\n🎯 Analyzing Specific Files Example');
  console.log('===================================\n');

  const analyzer = new DeadCodeAnalyzer();
  
  // Create a custom inventory for specific files
  const specificFiles: FileInventory[] = [
    {
      path: 'src/utils/helpers.ts',
      size: 1500,
      lastModified: new Date(),
      contentHash: 'hash1',
      fileType: 'typescript',
      workspace: 'root'
    },
    {
      path: 'src/components/UserCard.tsx',
      size: 2000,
      lastModified: new Date(),
      contentHash: 'hash2',
      fileType: 'typescript',
      workspace: 'frontend'
    }
  ];

  console.log('📋 Analyzing specific files:');
  specificFiles.forEach(file => {
    console.log(`   - ${file.path}`);
  });

  const result = await analyzer.analyze(specificFiles);
  
  console.log(`\n📊 Results: ${result.findings.length} findings`);
  result.findings.forEach((finding, index) => {
    console.log(`\n${index + 1}. ${finding.description}`);
    console.log(`   📁 File: ${finding.files[0]}`);
    console.log(`   🔧 Auto-fixable: ${finding.autoFixable ? '✅' : '❌'}`);
  });
}

/**
 * Example of using the analyzer with custom progress tracking
 */
async function analyzeWithCustomProgress(): Promise<void> {
  console.log('\n📊 Custom Progress Tracking Example');
  console.log('===================================\n');

  const analyzer = new DeadCodeAnalyzer();
  const scanner = new FileScanner();
  
  // Track progress with custom logic
  let lastReportedPercentage = 0;
  const progressCallback = (progress: any) => {
    // Only report every 10% to reduce noise
    if (progress.percentage >= lastReportedPercentage + 10) {
      console.log(`🔄 ${progress.currentStep}: ${progress.percentage}%`);
      lastReportedPercentage = progress.percentage;
    }
  };

  const inventory = await scanner.scan('.', progressCallback);
  const result = await analyzer.analyze(inventory, progressCallback);
  
  console.log(`\n✅ Analysis complete! Found ${result.findings.length} issues.`);
}

// Run the examples
if (require.main === module) {
  runDeadCodeAnalysisExample()
    .then(() => analyzeSpecificFiles())
    .then(() => analyzeWithCustomProgress())
    .catch(console.error);
}

export {
  runDeadCodeAnalysisExample,
  analyzeSpecificFiles,
  analyzeWithCustomProgress
};