import { TestFileAnalyzer } from '../analyzers/TestFileAnalyzer';
import { FileScanner } from '../core/FileScanner';
import { FileInventory } from '../types';

/**
 * Example usage of the TestFileAnalyzer
 * This demonstrates how to use the analyzer to identify test file issues
 */
async function runTestFileAnalyzerExample() {
  console.log('🧪 Test File Analyzer Example');
  console.log('==============================\n');

  // Initialize the analyzer
  const analyzer = new TestFileAnalyzer();
  
  console.log(`Analyzer: ${analyzer.name}`);
  console.log(`Description: ${analyzer.description}\n`);

  // Create a mock file inventory representing a typical project structure
  const mockInventory: FileInventory[] = [
    // Valid test files with corresponding source files
    {
      path: 'src/components/Button.test.tsx',
      size: 1500,
      lastModified: new Date('2023-12-01'),
      contentHash: 'hash1',
      fileType: 'typescript',
      workspace: 'frontend'
    },
    {
      path: 'src/components/Button.tsx',
      size: 2000,
      lastModified: new Date('2023-12-01'),
      contentHash: 'hash2',
      fileType: 'typescript',
      workspace: 'frontend'
    },
    
    // Orphaned test file (no corresponding source)
    {
      path: 'src/components/OldComponent.test.tsx',
      size: 800,
      lastModified: new Date('2023-10-15'),
      contentHash: 'hash3',
      fileType: 'typescript',
      workspace: 'frontend'
    },
    
    // Test files in __tests__ directory
    {
      path: 'src/utils/__tests__/helpers.test.ts',
      size: 1200,
      lastModified: new Date('2023-11-20'),
      contentHash: 'hash4',
      fileType: 'typescript',
      workspace: 'shared'
    },
    {
      path: 'src/utils/helpers.ts',
      size: 1800,
      lastModified: new Date('2023-11-20'),
      contentHash: 'hash5',
      fileType: 'typescript',
      workspace: 'shared'
    },
    
    // Backend test files
    {
      path: 'src/services/auth.test.js',
      size: 2200,
      lastModified: new Date('2023-12-05'),
      contentHash: 'hash6',
      fileType: 'javascript',
      workspace: 'backend'
    },
    {
      path: 'src/services/auth.js',
      size: 3000,
      lastModified: new Date('2023-12-05'),
      contentHash: 'hash7',
      fileType: 'javascript',
      workspace: 'backend'
    },
    
    // Orphaned backend test
    {
      path: 'src/services/deprecated.test.js',
      size: 500,
      lastModified: new Date('2023-08-10'),
      contentHash: 'hash8',
      fileType: 'javascript',
      workspace: 'backend'
    },
    
    // Integration test directory
    {
      path: 'tests/integration/api.test.js',
      size: 1800,
      lastModified: new Date('2023-11-30'),
      contentHash: 'hash9',
      fileType: 'javascript',
      workspace: 'backend'
    }
  ];

  console.log(`📁 Analyzing ${mockInventory.length} files...\n`);

  // Set up progress reporting
  const progressCallback = (progress: any) => {
    console.log(`⏳ ${progress.currentStep} (${progress.percentage}%)`);
  };

  try {
    // Check if analyzer can run
    const canRun = await analyzer.canRun();
    if (!canRun) {
      console.log('❌ Analyzer cannot run in current environment');
      return;
    }

    // Get estimated time
    const estimatedTime = analyzer.getEstimatedTime(mockInventory.length);
    console.log(`⏱️  Estimated analysis time: ${estimatedTime}ms\n`);

    // Run the analysis
    const startTime = Date.now();
    const result = await analyzer.analyze(mockInventory, progressCallback);
    const actualTime = Date.now() - startTime;

    console.log(`\n✅ Analysis completed in ${actualTime}ms`);
    console.log(`📊 Analysis Results:`);
    console.log(`   - Analyzer: ${result.analyzer}`);
    console.log(`   - Confidence: ${result.confidence}`);
    console.log(`   - Risk Level: ${result.riskLevel}`);
    console.log(`   - Total Findings: ${result.findings.length}\n`);

    // Display findings by category
    const findingsByType = result.findings.reduce((acc, finding) => {
      if (!acc[finding.type]) {
        acc[finding.type] = [];
      }
      acc[finding.type].push(finding);
      return acc;
    }, {} as Record<string, typeof result.findings>);

    for (const [type, findings] of Object.entries(findingsByType)) {
      console.log(`🔍 ${type.toUpperCase()} Issues (${findings.length}):`);
      
      findings.forEach((finding, index) => {
        console.log(`   ${index + 1}. ${finding.description}`);
        console.log(`      Files: ${finding.files.join(', ')}`);
        console.log(`      Recommendation: ${finding.recommendation}`);
        console.log(`      Auto-fixable: ${finding.autoFixable ? '✅' : '❌'}`);
        
        if (finding.estimatedSavings) {
          const savings = finding.estimatedSavings;
          if (savings.files) {
            console.log(`      Potential file cleanup: ${savings.files} files`);
          }
          if (savings.size) {
            console.log(`      Potential space savings: ${Math.round(savings.size / 1024)}KB`);
          }
        }
        console.log('');
      });
    }

    // Summary statistics
    const totalFiles = result.findings.reduce((sum, f) => sum + (f.estimatedSavings?.files || 0), 0);
    const totalSize = result.findings.reduce((sum, f) => sum + (f.estimatedSavings?.size || 0), 0);
    const autoFixableCount = result.findings.filter(f => f.autoFixable).length;

    console.log(`📈 Summary:`);
    console.log(`   - Total files that could be cleaned: ${totalFiles}`);
    console.log(`   - Total space that could be freed: ${Math.round(totalSize / 1024)}KB`);
    console.log(`   - Auto-fixable issues: ${autoFixableCount}/${result.findings.length}`);
    console.log(`   - Issues requiring manual review: ${result.findings.length - autoFixableCount}`);

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

/**
 * Example of using TestFileAnalyzer with FileScanner for real project analysis
 */
async function runRealProjectAnalysis() {
  console.log('\n🔍 Real Project Analysis Example');
  console.log('=================================\n');

  const scanner = new FileScanner('.');
  const analyzer = new TestFileAnalyzer();

  try {
    // Scan the current project (FileScanner automatically excludes node_modules, etc.)
    console.log('📁 Scanning project files...');
    const inventory = await scanner.scanRepository();

    console.log(`Found ${inventory.length} files\n`);

    // Filter to only test files for this example
    const testFiles = inventory.filter(file => 
      file.path.includes('.test.') || 
      file.path.includes('.spec.') || 
      file.path.includes('__tests__') ||
      file.path.includes('/tests/')
    );

    console.log(`Found ${testFiles.length} test files`);

    if (testFiles.length > 0) {
      console.log('Test files found:');
      testFiles.forEach(file => {
        console.log(`  - ${file.path} (${file.fileType})`);
      });

      // Run analysis on the full inventory (test files need source files for comparison)
      console.log('\n🧪 Running test file analysis...');
      const result = await analyzer.analyze(inventory);

      console.log(`\n📊 Found ${result.findings.length} test-related issues:`);
      result.findings.forEach((finding, index) => {
        console.log(`\n${index + 1}. ${finding.description}`);
        console.log(`   Type: ${finding.type}`);
        console.log(`   Files: ${finding.files.join(', ')}`);
        console.log(`   Auto-fixable: ${finding.autoFixable ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('No test files found in current directory');
    }

  } catch (error) {
    console.error('❌ Real project analysis failed:', error);
  }
}

// Run the examples
if (require.main === module) {
  runTestFileAnalyzerExample()
    .then(() => runRealProjectAnalysis())
    .catch(console.error);
}

export { runTestFileAnalyzerExample, runRealProjectAnalysis };