import * as fs from 'fs';
import * as path from 'path';
import { Analyzer, FileInventory, AnalysisResult, Finding, ProgressInfo } from '../types';

/**
 * Represents a package.json file with its dependencies
 */
interface PackageInfo {
  path: string;
  content: any;
  dependencies: Set<string>;
  devDependencies: Set<string>;
  peerDependencies: Set<string>;
  workspace: string;
}

/**
 * Represents usage of a dependency in source files
 */
interface DependencyUsage {
  packageName: string;
  usedIn: string[];
  importType: 'import' | 'require' | 'dynamic';
}

/**
 * Analyzer that identifies unused dependencies and misplaced dev/prod dependencies
 */
export class DependencyAnalyzer implements Analyzer {
  readonly name = 'dependency-analyzer';
  readonly description = 'Identifies unused dependencies and misplaced dev/prod dependencies in package.json files';

  /**
   * Analyze file inventory to find dependency issues
   */
  async analyze(
    inventory: FileInventory[], 
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<AnalysisResult> {
    const findings: Finding[] = [];
    
    this.reportProgress(progressCallback, 'Scanning package.json files', 0);
    
    // Find all package.json files
    const packageFiles = this.findPackageFiles(inventory);
    
    this.reportProgress(progressCallback, 'Parsing package.json files', 10);
    
    // Parse package.json files
    const packages = await this.parsePackageFiles(packageFiles);
    
    this.reportProgress(progressCallback, 'Scanning source files for imports', 25);
    
    // Scan source files for import statements
    const dependencyUsage = await this.scanSourceFilesForImports(inventory, progressCallback);
    
    this.reportProgress(progressCallback, 'Analyzing unused dependencies', 60);
    
    // Analyze each package for unused dependencies
    for (const pkg of packages) {
      const unusedFindings = this.analyzeUnusedDependencies(pkg, dependencyUsage);
      findings.push(...unusedFindings);
      
      const misplacedFindings = this.analyzeMisplacedDependencies(pkg, dependencyUsage);
      findings.push(...misplacedFindings);
    }
    
    this.reportProgress(progressCallback, 'Analysis complete', 100);
    
    return {
      analyzer: this.name,
      findings,
      confidence: 'high',
      riskLevel: 'review' // Dependencies require careful review before removal
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
    // Roughly 2ms per file for dependency analysis
    return inventorySize * 2;
  }

  /**
   * Find all package.json files in the inventory
   */
  private findPackageFiles(inventory: FileInventory[]): FileInventory[] {
    return inventory.filter(file => 
      path.basename(file.path) === 'package.json' &&
      !file.path.includes('node_modules') &&
      !file.path.includes('.next')
    );
  }

  /**
   * Parse package.json files and extract dependency information
   */
  private async parsePackageFiles(packageFiles: FileInventory[]): Promise<PackageInfo[]> {
    const packages: PackageInfo[] = [];
    
    for (const file of packageFiles) {
      try {
        const content = JSON.parse(fs.readFileSync(file.path, 'utf-8'));
        
        const packageInfo: PackageInfo = {
          path: file.path,
          content,
          dependencies: new Set(Object.keys(content.dependencies || {})),
          devDependencies: new Set(Object.keys(content.devDependencies || {})),
          peerDependencies: new Set(Object.keys(content.peerDependencies || {})),
          workspace: this.determineWorkspace(file.path)
        };
        
        packages.push(packageInfo);
      } catch (error) {
        // Skip malformed package.json files
        console.warn(`Failed to parse ${file.path}:`, error);
      }
    }
    
    return packages;
  }

  /**
   * Determine which workspace a package.json belongs to
   */
  private determineWorkspace(packagePath: string): string {
    if (packagePath.includes('apps/frontend')) return 'frontend';
    if (packagePath.includes('apps/backend')) return 'backend';
    if (packagePath.includes('packages/shared')) return 'shared';
    if (packagePath.includes('packages/types')) return 'types';
    if (packagePath.includes('packages/utils')) return 'utils';
    if (packagePath === 'package.json') return 'root';
    return 'unknown';
  }

  /**
   * Scan source files for import statements to track dependency usage
   */
  private async scanSourceFilesForImports(
    inventory: FileInventory[], 
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<Map<string, DependencyUsage>> {
    const dependencyUsage = new Map<string, DependencyUsage>();
    
    // Filter to source files that might contain imports
    const sourceFiles = inventory.filter(file => 
      ['typescript', 'javascript'].includes(file.fileType) &&
      !file.path.includes('node_modules') &&
      !file.path.includes('.next') &&
      !file.path.includes('dist') &&
      !file.path.includes('build')
    );
    
    let processedFiles = 0;
    const totalFiles = sourceFiles.length;
    
    for (const file of sourceFiles) {
      try {
        const content = fs.readFileSync(file.path, 'utf-8');
        const imports = this.extractImports(content);
        
        for (const importInfo of imports) {
          const packageName = this.extractPackageName(importInfo.module);
          if (packageName) {
            if (!dependencyUsage.has(packageName)) {
              dependencyUsage.set(packageName, {
                packageName,
                usedIn: [],
                importType: importInfo.type
              });
            }
            
            const usage = dependencyUsage.get(packageName)!;
            if (!usage.usedIn.includes(file.path)) {
              usage.usedIn.push(file.path);
            }
          }
        }
      } catch (error) {
        // Skip files that can't be read
        console.warn(`Failed to read ${file.path}:`, error);
      }
      
      processedFiles++;
      if (processedFiles % 50 === 0) {
        const percentage = 25 + Math.round((processedFiles / totalFiles) * 35);
        this.reportProgress(progressCallback, `Scanned ${processedFiles}/${totalFiles} source files`, percentage);
      }
    }
    
    return dependencyUsage;
  }

  /**
   * Extract import statements from source code
   */
  private extractImports(content: string): Array<{ module: string; type: 'import' | 'require' | 'dynamic' }> {
    const imports: Array<{ module: string; type: 'import' | 'require' | 'dynamic' }> = [];
    
    // ES6 import statements
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push({
        module: match[1],
        type: 'import'
      });
    }
    
    // CommonJS require statements
    const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push({
        module: match[1],
        type: 'require'
      });
    }
    
    // Dynamic imports
    const dynamicImportRegex = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push({
        module: match[1],
        type: 'dynamic'
      });
    }
    
    return imports;
  }

  /**
   * Extract the package name from an import module string
   */
  private extractPackageName(module: string): string | null {
    // Skip relative imports
    if (module.startsWith('.') || module.startsWith('/')) {
      return null;
    }
    
    // Handle scoped packages (@scope/package)
    if (module.startsWith('@')) {
      const parts = module.split('/');
      if (parts.length >= 2) {
        return `${parts[0]}/${parts[1]}`;
      }
      return parts[0];
    }
    
    // Handle regular packages (package or package/subpath)
    const parts = module.split('/');
    return parts[0];
  }

  /**
   * Analyze unused dependencies in a package
   */
  private analyzeUnusedDependencies(
    pkg: PackageInfo, 
    dependencyUsage: Map<string, DependencyUsage>
  ): Finding[] {
    const findings: Finding[] = [];
    
    // Check production dependencies
    const unusedDependencies: string[] = [];
    for (const dep of pkg.dependencies) {
      if (!dependencyUsage.has(dep) && !this.isKnownRuntimeDependency(dep)) {
        unusedDependencies.push(dep);
      }
    }
    
    if (unusedDependencies.length > 0) {
      findings.push({
        type: 'unused',
        files: [pkg.path],
        description: `Found ${unusedDependencies.length} unused production dependencies in ${pkg.workspace} workspace`,
        recommendation: `Remove unused dependencies: ${unusedDependencies.join(', ')}`,
        autoFixable: false, // Requires manual verification
        estimatedSavings: {
          dependencies: unusedDependencies.length
        }
      });
    }
    
    // Check dev dependencies
    const unusedDevDependencies: string[] = [];
    for (const dep of pkg.devDependencies) {
      if (!dependencyUsage.has(dep) && !this.isKnownBuildTimeDependency(dep)) {
        unusedDevDependencies.push(dep);
      }
    }
    
    if (unusedDevDependencies.length > 0) {
      findings.push({
        type: 'unused',
        files: [pkg.path],
        description: `Found ${unusedDevDependencies.length} unused dev dependencies in ${pkg.workspace} workspace`,
        recommendation: `Remove unused dev dependencies: ${unusedDevDependencies.join(', ')}`,
        autoFixable: false,
        estimatedSavings: {
          dependencies: unusedDevDependencies.length
        }
      });
    }
    
    return findings;
  }

  /**
   * Analyze misplaced dependencies (dev deps in prod, prod deps in dev)
   */
  private analyzeMisplacedDependencies(
    pkg: PackageInfo, 
    dependencyUsage: Map<string, DependencyUsage>
  ): Finding[] {
    const findings: Finding[] = [];
    
    // Check for dev dependencies that should be production dependencies
    const misplacedToProd: string[] = [];
    for (const dep of pkg.devDependencies) {
      const usage = dependencyUsage.get(dep);
      if (usage && this.isUsedInProduction(usage, pkg.workspace)) {
        misplacedToProd.push(dep);
      }
    }
    
    if (misplacedToProd.length > 0) {
      findings.push({
        type: 'inconsistent',
        files: [pkg.path],
        description: `Found ${misplacedToProd.length} dev dependencies that are used in production code`,
        recommendation: `Move to dependencies: ${misplacedToProd.join(', ')}`,
        autoFixable: false,
        estimatedSavings: undefined
      });
    }
    
    // Check for production dependencies that should be dev dependencies
    const misplacedToDev: string[] = [];
    for (const dep of pkg.dependencies) {
      const usage = dependencyUsage.get(dep);
      if (usage && this.isOnlyUsedInDevelopment(usage, pkg.workspace)) {
        misplacedToDev.push(dep);
      }
    }
    
    if (misplacedToDev.length > 0) {
      findings.push({
        type: 'inconsistent',
        files: [pkg.path],
        description: `Found ${misplacedToDev.length} production dependencies that are only used in development`,
        recommendation: `Move to devDependencies: ${misplacedToDev.join(', ')}`,
        autoFixable: false,
        estimatedSavings: undefined
      });
    }
    
    return findings;
  }

  /**
   * Check if a dependency is known to be used at runtime even without explicit imports
   */
  private isKnownRuntimeDependency(packageName: string): boolean {
    const runtimeDependencies = [
      'next', // Next.js runtime
      'react', // React runtime
      'react-dom', // React DOM runtime
      'express', // Express server
      '@prisma/client', // Prisma runtime
      'socket.io', // Socket.io runtime
      'stripe', // Stripe runtime
      'mongodb', // MongoDB driver
      'redis', // Redis client
      'nodemailer', // Email runtime
      'twilio', // Twilio runtime
      'winston', // Logging runtime
      'dotenv', // Environment variables
      'cors', // CORS middleware
      'helmet', // Security middleware
      'cookie-parser', // Cookie parsing middleware
      'express-rate-limit', // Rate limiting middleware
    ];
    
    return runtimeDependencies.includes(packageName);
  }

  /**
   * Check if a dependency is known to be used at build time
   */
  private isKnownBuildTimeDependency(packageName: string): boolean {
    const buildTimeDependencies = [
      'typescript', // TypeScript compiler
      'eslint', // Linting
      'prettier', // Code formatting
      'jest', // Testing framework
      'vitest', // Testing framework
      '@types/', // TypeScript type definitions (prefix)
      'nodemon', // Development server
      'concurrently', // Running multiple commands
      'autoprefixer', // CSS processing
      'postcss', // CSS processing
      'tailwindcss', // CSS framework
      'prisma', // Database schema management
      '@testing-library/', // Testing utilities (prefix)
      'supertest', // API testing
      '@vitest/ui', // Vitest UI
    ];
    
    return buildTimeDependencies.some(dep => 
      packageName === dep || packageName.startsWith(dep)
    );
  }

  /**
   * Check if a dependency is used in production code
   */
  private isUsedInProduction(usage: DependencyUsage, workspace: string): boolean {
    return usage.usedIn.some(filePath => {
      // Exclude test files, config files, and development-only files
      const isTestFile = /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath) ||
                        filePath.includes('__tests__') ||
                        filePath.includes('/tests/');
      
      const isConfigFile = /\.(config|setup)\.(ts|tsx|js|jsx)$/.test(filePath) ||
                          filePath.includes('jest.config') ||
                          filePath.includes('vitest.config') ||
                          filePath.includes('tailwind.config') ||
                          filePath.includes('next.config');
      
      const isDevFile = filePath.includes('/dev/') ||
                       filePath.includes('/development/') ||
                       filePath.includes('nodemon') ||
                       filePath.includes('.dev.');
      
      return !isTestFile && !isConfigFile && !isDevFile;
    });
  }

  /**
   * Check if a dependency is only used in development/test code
   */
  private isOnlyUsedInDevelopment(usage: DependencyUsage, workspace: string): boolean {
    return usage.usedIn.every(filePath => {
      const isTestFile = /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath) ||
                        filePath.includes('__tests__') ||
                        filePath.includes('/tests/');
      
      const isConfigFile = /\.(config|setup)\.(ts|tsx|js|jsx)$/.test(filePath) ||
                          filePath.includes('jest.config') ||
                          filePath.includes('vitest.config') ||
                          filePath.includes('tailwind.config') ||
                          filePath.includes('next.config');
      
      const isDevFile = filePath.includes('/dev/') ||
                       filePath.includes('/development/') ||
                       filePath.includes('scripts/') ||
                       filePath.includes('.dev.');
      
      return isTestFile || isConfigFile || isDevFile;
    });
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