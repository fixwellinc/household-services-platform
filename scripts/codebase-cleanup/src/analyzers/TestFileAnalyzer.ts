import { Analyzer, FileInventory, AnalysisResult, Finding, ProgressInfo } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Analyzer that identifies test files and detects obsolete or problematic test files
 */
export class TestFileAnalyzer implements Analyzer {
  readonly name = 'test-file-analyzer';
  readonly description = 'Identifies test files using naming patterns and detects obsolete test imports and empty test suites';

  private readonly testPatterns = [
    /\.test\.(ts|tsx|js|jsx)$/,
    /\.spec\.(ts|tsx|js|jsx)$/,
    /__tests__\//,
    /\/tests?\//,
    /\.test\.$/,
    /\.spec\.$/
  ];

  /**
   * Analyze file inventory to find test-related issues
   */
  async analyze(
    inventory: FileInventory[], 
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<AnalysisResult> {
    const findings: Finding[] = [];
    
    this.reportProgress(progressCallback, 'Identifying test files', 0);
    
    // Identify all test files
    const testFiles = this.identifyTestFiles(inventory);
    const sourceFiles = this.identifySourceFiles(inventory);
    
    this.reportProgress(progressCallback, 'Analyzing test file relationships', 25);
    
    // Find orphaned test files (tests without corresponding source files)
    const orphanedTests = await this.findOrphanedTestFiles(testFiles, sourceFiles);
    findings.push(...orphanedTests);
    
    this.reportProgress(progressCallback, 'Checking for obsolete imports', 50);
    
    // Check for obsolete imports in test files
    const obsoleteImportFindings = await this.findObsoleteImports(testFiles, sourceFiles, progressCallback);
    findings.push(...obsoleteImportFindings);
    
    this.reportProgress(progressCallback, 'Detecting empty test suites', 75);
    
    // Find empty or minimal test suites
    const emptyTestFindings = await this.findEmptyTestSuites(testFiles, progressCallback);
    findings.push(...emptyTestFindings);
    
    this.reportProgress(progressCallback, 'Analysis complete', 100);
    
    return {
      analyzer: this.name,
      findings,
      confidence: 'high',
      riskLevel: 'review' // Test file changes should be reviewed
    };
  }

  /**
   * Check if analyzer can run
   */
  async canRun(): Promise<boolean> {
    return true;
  }

  /**
   * Estimate time based on inventory size
   */
  getEstimatedTime(inventorySize: number): number {
    // Roughly 3ms per file (need to read test file contents)
    return inventorySize * 3;
  }

  /**
   * Identify test files from the inventory
   */
  private identifyTestFiles(inventory: FileInventory[]): FileInventory[] {
    return inventory.filter(file => this.isTestFile(file.path));
  }

  /**
   * Identify source files (non-test files) from the inventory
   */
  private identifySourceFiles(inventory: FileInventory[]): FileInventory[] {
    return inventory.filter(file => 
      !this.isTestFile(file.path) && 
      ['typescript', 'javascript'].includes(file.fileType) &&
      !file.path.includes('node_modules') &&
      !file.path.includes('.d.ts')
    );
  }

  /**
   * Check if a file path represents a test file
   */
  private isTestFile(filePath: string): boolean {
    return this.testPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Find test files that don't have corresponding source files
   */
  private async findOrphanedTestFiles(
    testFiles: FileInventory[], 
    sourceFiles: FileInventory[]
  ): Promise<Finding[]> {
    const findings: Finding[] = [];
    const sourceFilePaths = new Set(sourceFiles.map(f => f.path));
    
    for (const testFile of testFiles) {
      const correspondingSourcePath = this.getCorrespondingSourcePath(testFile.path);
      
      if (correspondingSourcePath && !sourceFilePaths.has(correspondingSourcePath)) {
        // Check for alternative source file locations
        const alternativePaths = this.getAlternativeSourcePaths(testFile.path);
        const hasAlternative = alternativePaths.some(altPath => sourceFilePaths.has(altPath));
        
        if (!hasAlternative) {
          findings.push({
            type: 'obsolete',
            files: [testFile.path],
            description: `Test file '${testFile.path}' appears to be orphaned - no corresponding source file found`,
            recommendation: `Review and remove test file if the corresponding source file '${correspondingSourcePath}' no longer exists`,
            autoFixable: false, // Requires manual verification
            estimatedSavings: {
              files: 1,
              size: testFile.size
            }
          });
        }
      }
    }
    
    return findings;
  }

  /**
   * Get the expected corresponding source file path for a test file
   */
  private getCorrespondingSourcePath(testFilePath: string): string | null {
    // Remove test-specific patterns to get source path
    let sourcePath = testFilePath;
    
    // Handle __tests__ directory pattern
    if (sourcePath.includes('__tests__')) {
      sourcePath = sourcePath.replace('/__tests__/', '/');
      sourcePath = sourcePath.replace('\\__tests__\\', '\\');
    }
    
    // Handle /tests/ directory pattern
    if (sourcePath.includes('/tests/')) {
      sourcePath = sourcePath.replace('/tests/', '/');
    }
    if (sourcePath.includes('\\tests\\')) {
      sourcePath = sourcePath.replace('\\tests\\', '\\');
    }
    
    // Remove .test and .spec from filename
    sourcePath = sourcePath.replace(/\.test\.(ts|tsx|js|jsx)$/, '.$1');
    sourcePath = sourcePath.replace(/\.spec\.(ts|tsx|js|jsx)$/, '.$1');
    
    return sourcePath !== testFilePath ? sourcePath : null;
  }

  /**
   * Get alternative source file paths that might correspond to a test file
   */
  private getAlternativeSourcePaths(testFilePath: string): string[] {
    const alternatives: string[] = [];
    const basePath = this.getCorrespondingSourcePath(testFilePath);
    
    if (!basePath) return alternatives;
    
    const dir = path.dirname(basePath);
    const name = path.basename(basePath, path.extname(basePath));
    const ext = path.extname(basePath);
    
    // Try different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    for (const altExt of extensions) {
      if (altExt !== ext) {
        alternatives.push(path.join(dir, name + altExt).replace(/\\/g, '/'));
      }
    }
    
    // Try index files in directories
    alternatives.push(path.join(dir, name, 'index' + ext).replace(/\\/g, '/'));
    alternatives.push(path.join(dir, name, 'index.ts').replace(/\\/g, '/'));
    alternatives.push(path.join(dir, name, 'index.tsx').replace(/\\/g, '/'));
    
    return alternatives;
  }

  /**
   * Find test files with obsolete imports
   */
  private async findObsoleteImports(
    testFiles: FileInventory[], 
    sourceFiles: FileInventory[],
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<Finding[]> {
    const findings: Finding[] = [];
    const sourceFilePaths = new Set(sourceFiles.map(f => f.path));
    
    let processedFiles = 0;
    
    for (const testFile of testFiles) {
      try {
        const content = await fs.readFile(testFile.path, 'utf-8');
        const obsoleteImports = this.findObsoleteImportsInContent(content, testFile.path, sourceFilePaths);
        
        if (obsoleteImports.length > 0) {
          findings.push({
            type: 'obsolete',
            files: [testFile.path],
            description: `Test file contains ${obsoleteImports.length} obsolete import(s): ${obsoleteImports.join(', ')}`,
            recommendation: `Update or remove obsolete imports in test file`,
            autoFixable: false, // Requires careful review of test logic
            estimatedSavings: {
              files: 0 // File won't be removed, just cleaned up
            }
          });
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
      
      processedFiles++;
      if (processedFiles % 10 === 0 && progressCallback) {
        const percentage = 50 + Math.round((processedFiles / testFiles.length) * 25);
        this.reportProgress(progressCallback, `Analyzed ${processedFiles}/${testFiles.length} test files for obsolete imports`, percentage);
      }
    }
    
    return findings;
  }

  /**
   * Find obsolete imports in test file content
   */
  private findObsoleteImportsInContent(
    content: string, 
    testFilePath: string, 
    sourceFilePaths: Set<string>
  ): string[] {
    const obsoleteImports: string[] = [];
    const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Skip external packages (don't start with . or /)
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        continue;
      }
      
      // Resolve relative import path
      const resolvedPath = this.resolveImportPath(importPath, testFilePath);
      
      if (resolvedPath) {
        // Check for alternative extensions
        const alternatives = this.getImportAlternatives(resolvedPath);
        
        // Convert absolute paths to relative paths for comparison
        const relativePath = path.relative(process.cwd(), resolvedPath).replace(/\\/g, '/');
        const relativeAlternatives = alternatives.map(alt => 
          path.relative(process.cwd(), alt).replace(/\\/g, '/')
        );
        
        const hasValidAlternative = relativeAlternatives.some(alt => sourceFilePaths.has(alt));
        
        if (!hasValidAlternative) {
          obsoleteImports.push(importPath);
        }
      }
    }
    
    return obsoleteImports;
  }

  /**
   * Resolve a relative import path to an absolute path
   */
  private resolveImportPath(importPath: string, fromFilePath: string): string | null {
    try {
      const fromDir = path.dirname(fromFilePath);
      let resolvedPath = path.resolve(fromDir, importPath);
      
      // Normalize path separators
      resolvedPath = resolvedPath.replace(/\\/g, '/');
      
      // If no extension, try common extensions
      if (!path.extname(resolvedPath)) {
        // Return the base path without extension - we'll check alternatives later
        return resolvedPath;
      }
      
      return resolvedPath;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get alternative paths for an import (different extensions)
   */
  private getImportAlternatives(resolvedPath: string): string[] {
    const alternatives: string[] = [];
    
    // If the path already has an extension, also try without extension + other extensions
    const withoutExt = resolvedPath.replace(/\.(ts|tsx|js|jsx|json)$/, '');
    
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    for (const ext of extensions) {
      alternatives.push(withoutExt + ext);
    }
    
    // Add index file alternatives
    alternatives.push(
      path.join(withoutExt, 'index.ts').replace(/\\/g, '/'),
      path.join(withoutExt, 'index.tsx').replace(/\\/g, '/'),
      path.join(withoutExt, 'index.js').replace(/\\/g, '/'),
      path.join(withoutExt, 'index.jsx').replace(/\\/g, '/'),
    );
    
    return alternatives;
  }

  /**
   * Find empty or minimal test suites
   */
  private async findEmptyTestSuites(
    testFiles: FileInventory[],
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<Finding[]> {
    const findings: Finding[] = [];
    let processedFiles = 0;
    
    for (const testFile of testFiles) {
      try {
        const content = await fs.readFile(testFile.path, 'utf-8');
        const isEmpty = this.isEmptyTestSuite(content);
        
        if (isEmpty) {
          findings.push({
            type: 'obsolete',
            files: [testFile.path],
            description: `Test file appears to be empty or contains no meaningful test assertions`,
            recommendation: `Review test file and either add proper tests or remove if no longer needed`,
            autoFixable: false, // Requires manual review
            estimatedSavings: {
              files: 1,
              size: testFile.size
            }
          });
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
      
      processedFiles++;
      if (processedFiles % 10 === 0 && progressCallback) {
        const percentage = 75 + Math.round((processedFiles / testFiles.length) * 25);
        this.reportProgress(progressCallback, `Analyzed ${processedFiles}/${testFiles.length} test files for empty suites`, percentage);
      }
    }
    
    return findings;
  }

  /**
   * Check if a test file is empty or contains no meaningful tests
   */
  private isEmptyTestSuite(content: string): boolean {
    // Remove comments and whitespace for analysis
    const cleanContent = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Check if file is essentially empty
    if (cleanContent.length < 50) {
      return true;
    }
    
    // Check for test function patterns
    const testPatterns = [
      /\b(test|it|describe)\s*\(/g,
      /\b(expect|assert)\s*\(/g,
      /\b(beforeEach|afterEach|beforeAll|afterAll)\s*\(/g
    ];
    
    const hasTestFunctions = testPatterns.some(pattern => pattern.test(cleanContent));
    
    if (!hasTestFunctions) {
      return true;
    }
    
    // Count test assertions
    const assertionCount = (cleanContent.match(/\b(expect|assert)\s*\(/g) || []).length;
    
    // If there are test functions but very few assertions, it might be empty
    if (assertionCount === 0) {
      return true;
    }
    
    // Check for placeholder or TODO tests
    const placeholderPatterns = [
      /todo/i,
      /placeholder/i,
      /not implemented/i,
      /skip/i,
      /pending/i
    ];
    
    const hasPlaceholders = placeholderPatterns.some(pattern => pattern.test(cleanContent));
    
    // If it's mostly placeholders and very few assertions, consider it empty
    if (hasPlaceholders && assertionCount <= 1) {
      return true;
    }
    
    return false;
  }

  /**
   * Report progress if callback is provided
   */
  private reportProgress(
    callback: ((progress: ProgressInfo) => void) | undefined,
    step: string,
    percentage: number
  ): void {
    if (callback) {
      callback({
        currentStep: step,
        completedSteps: percentage,
        totalSteps: 100,
        percentage,
        details: `${this.name}: ${step}`
      });
    }
  }
}