#!/usr/bin/env node

/**
 * Dashboard Routing Cleanup Script
 * 
 * This script identifies and reports duplicate routing logic and unused dashboard code
 * that should be cleaned up after the dashboard routing consolidation.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_DIR = path.join(__dirname, '..');
const PATTERNS_TO_CHECK = [
  // Old routing patterns
  '/dashboard/customer',
  'isSubscribed.*dashboard',
  'dashboard.*isSubscribed',
  
  // Hardcoded routing logic
  'router\\.push.*dashboard',
  'window\\.location.*dashboard',
  
  // Old subscription detection patterns
  'userPlanData\\?.*(success|hasPlan).*status.*ACTIVE',
  'subscription\\?.*(status.*===.*ACTIVE)',
];

const DIRECTORIES_TO_SCAN = [
  'app',
  'components',
  'hooks',
  'lib',
  'contexts',
];

const EXCLUDE_PATTERNS = [
  '__tests__',
  'node_modules',
  '.next',
  '.git',
];

class DashboardRoutingCleanup {
  constructor() {
    this.issues = [];
    this.filesScanned = 0;
    this.duplicateLogicFound = [];
    this.unusedCodeFound = [];
  }

  /**
   * Run the cleanup analysis
   */
  async run() {
    console.log('🔍 Starting Dashboard Routing Cleanup Analysis...\n');
    
    try {
      // Scan for duplicate routing logic
      await this.scanForDuplicateLogic();
      
      // Check for unused dashboard code
      await this.checkForUnusedCode();
      
      // Generate cleanup report
      this.generateReport();
      
      // Provide cleanup recommendations
      this.provideRecommendations();
      
    } catch (error) {
      console.error('❌ Error during cleanup analysis:', error.message);
      process.exit(1);
    }
  }

  /**
   * Scan for duplicate routing logic
   */
  async scanForDuplicateLogic() {
    console.log('📂 Scanning for duplicate routing logic...');
    
    for (const dir of DIRECTORIES_TO_SCAN) {
      const dirPath = path.join(FRONTEND_DIR, dir);
      if (fs.existsSync(dirPath)) {
        await this.scanDirectory(dirPath);
      }
    }
    
    console.log(`✅ Scanned ${this.filesScanned} files\n`);
  }

  /**
   * Recursively scan directory for files
   */
  async scanDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Skip excluded directories
      if (entry.isDirectory()) {
        if (!EXCLUDE_PATTERNS.some(pattern => entry.name.includes(pattern))) {
          await this.scanDirectory(fullPath);
        }
        continue;
      }
      
      // Only scan relevant file types
      if (this.isRelevantFile(entry.name)) {
        await this.scanFile(fullPath);
      }
    }
  }

  /**
   * Check if file is relevant for scanning
   */
  isRelevantFile(filename) {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Scan individual file for issues
   */
  async scanFile(filePath) {
    this.filesScanned++;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(FRONTEND_DIR, filePath);
      
      // Check for each pattern
      for (const pattern of PATTERNS_TO_CHECK) {
        const regex = new RegExp(pattern, 'gi');
        const matches = content.match(regex);
        
        if (matches) {
          this.duplicateLogicFound.push({
            file: relativePath,
            pattern,
            matches: matches.length,
            lines: this.getMatchingLines(content, regex),
          });
        }
      }
      
    } catch (error) {
      console.warn(`⚠️  Could not read file: ${filePath}`);
    }
  }

  /**
   * Get line numbers for matches
   */
  getMatchingLines(content, regex) {
    const lines = content.split('\n');
    const matchingLines = [];
    
    lines.forEach((line, index) => {
      if (regex.test(line)) {
        matchingLines.push({
          number: index + 1,
          content: line.trim(),
        });
      }
    });
    
    return matchingLines;
  }

  /**
   * Check for unused dashboard code
   */
  async checkForUnusedCode() {
    console.log('🗑️  Checking for unused dashboard code...');
    
    const potentialUnusedFiles = [
      'app/(dashboard)/dashboard/customer',
      'components/dashboard/OldDashboard.tsx',
      'hooks/use-old-dashboard.ts',
      'lib/old-dashboard-utils.ts',
    ];
    
    for (const file of potentialUnusedFiles) {
      const filePath = path.join(FRONTEND_DIR, file);
      if (fs.existsSync(filePath)) {
        this.unusedCodeFound.push(file);
      }
    }
    
    console.log(`✅ Checked for unused code\n`);
  }

  /**
   * Generate cleanup report
   */
  generateReport() {
    console.log('📊 DASHBOARD ROUTING CLEANUP REPORT');
    console.log('=====================================\n');
    
    // Summary
    console.log('📈 SUMMARY:');
    console.log(`   Files scanned: ${this.filesScanned}`);
    console.log(`   Duplicate logic instances: ${this.duplicateLogicFound.length}`);
    console.log(`   Unused code files: ${this.unusedCodeFound.length}\n`);
    
    // Duplicate logic details
    if (this.duplicateLogicFound.length > 0) {
      console.log('🔄 DUPLICATE ROUTING LOGIC FOUND:');
      console.log('----------------------------------');
      
      const groupedByPattern = this.groupByPattern(this.duplicateLogicFound);
      
      for (const [pattern, instances] of Object.entries(groupedByPattern)) {
        console.log(`\n📌 Pattern: ${pattern}`);
        console.log(`   Instances: ${instances.length}`);
        
        instances.forEach(instance => {
          console.log(`   📁 ${instance.file}`);
          instance.lines.forEach(line => {
            console.log(`      Line ${line.number}: ${line.content}`);
          });
        });
      }
      console.log();
    }
    
    // Unused code details
    if (this.unusedCodeFound.length > 0) {
      console.log('🗑️  UNUSED CODE FOUND:');
      console.log('----------------------');
      this.unusedCodeFound.forEach(file => {
        console.log(`   📁 ${file}`);
      });
      console.log();
    }
    
    // Performance impact
    this.reportPerformanceImpact();
  }

  /**
   * Group duplicate logic by pattern
   */
  groupByPattern(duplicateLogic) {
    return duplicateLogic.reduce((groups, item) => {
      const pattern = item.pattern;
      if (!groups[pattern]) {
        groups[pattern] = [];
      }
      groups[pattern].push(item);
      return groups;
    }, {});
  }

  /**
   * Report performance impact
   */
  reportPerformanceImpact() {
    console.log('⚡ PERFORMANCE IMPACT ANALYSIS:');
    console.log('-------------------------------');
    
    const totalIssues = this.duplicateLogicFound.length + this.unusedCodeFound.length;
    
    if (totalIssues === 0) {
      console.log('   ✅ No performance issues detected');
      console.log('   ✅ Dashboard routing is optimized');
    } else {
      console.log(`   ⚠️  ${totalIssues} potential performance issues found`);
      console.log('   📉 Duplicate logic may cause:');
      console.log('      - Slower routing decisions');
      console.log('      - Increased bundle size');
      console.log('      - Memory overhead');
      console.log('      - Maintenance complexity');
    }
    console.log();
  }

  /**
   * Provide cleanup recommendations
   */
  provideRecommendations() {
    console.log('💡 CLEANUP RECOMMENDATIONS:');
    console.log('============================\n');
    
    if (this.duplicateLogicFound.length === 0 && this.unusedCodeFound.length === 0) {
      console.log('🎉 Excellent! No cleanup needed.');
      console.log('   Your dashboard routing is already optimized.\n');
      return;
    }
    
    // Recommendations for duplicate logic
    if (this.duplicateLogicFound.length > 0) {
      console.log('🔄 For Duplicate Routing Logic:');
      console.log('   1. Replace hardcoded routing with useDashboardRouting hook');
      console.log('   2. Remove old subscription detection patterns');
      console.log('   3. Consolidate routing decisions in centralized hooks');
      console.log('   4. Update components to use new routing system\n');
    }
    
    // Recommendations for unused code
    if (this.unusedCodeFound.length > 0) {
      console.log('🗑️  For Unused Code:');
      console.log('   1. Remove unused dashboard components');
      console.log('   2. Delete old routing utilities');
      console.log('   3. Clean up unused imports');
      console.log('   4. Update documentation\n');
    }
    
    // Performance optimization recommendations
    console.log('⚡ Performance Optimization:');
    console.log('   1. Implement subscription data caching');
    console.log('   2. Add performance monitoring');
    console.log('   3. Use React.memo for expensive components');
    console.log('   4. Implement route preloading');
    console.log('   5. Add loading states for better UX\n');
    
    // Next steps
    console.log('🚀 Next Steps:');
    console.log('   1. Review and fix identified issues');
    console.log('   2. Run performance tests');
    console.log('   3. Update documentation');
    console.log('   4. Monitor performance metrics');
    console.log('   5. Schedule regular cleanup reviews\n');
  }
}

// Run the cleanup analysis
if (require.main === module) {
  const cleanup = new DashboardRoutingCleanup();
  cleanup.run().catch(error => {
    console.error('❌ Cleanup analysis failed:', error);
    process.exit(1);
  });
}

module.exports = DashboardRoutingCleanup;