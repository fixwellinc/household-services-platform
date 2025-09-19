import { Analyzer, FileInventory, AnalysisResult, Finding, ProgressInfo } from '../types';
import * as path from 'path';

/**
 * Naming convention types detected in the codebase
 */
type NamingConvention = 'camelCase' | 'kebab-case' | 'snake_case' | 'PascalCase' | 'UPPER_CASE' | 'mixed';

/**
 * Directory structure pattern for similar modules
 */
interface DirectoryPattern {
  pattern: string;
  files: string[];
  commonStructure: string[];
  inconsistencies: string[];
}

/**
 * File move recommendation with import tracking
 */
interface MoveRecommendation {
  from: string;
  to: string;
  reason: string;
  affectedImports: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Analyzer that identifies inconsistent file naming conventions and directory structures
 * and provides recommendations for standardization
 */
export class FileStructureAnalyzer implements Analyzer {
  readonly name = 'file-structure-analyzer';
  readonly description = 'Analyzes file naming conventions and directory structures for consistency and standardization opportunities';

  /**
   * Analyze file inventory for naming and structure inconsistencies
   */
  async analyze(
    inventory: FileInventory[], 
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<AnalysisResult> {
    const findings: Finding[] = [];
    
    this.reportProgress(progressCallback, 'Analyzing naming conventions', 0);
    
    // Analyze naming conventions
    const namingFindings = this.analyzeNamingConventions(inventory);
    findings.push(...namingFindings);
    
    this.reportProgress(progressCallback, 'Analyzing directory structures', 25);
    
    // Analyze directory structure consistency
    const structureFindings = this.analyzeDirectoryStructures(inventory);
    findings.push(...structureFindings);
    
    this.reportProgress(progressCallback, 'Detecting misplaced files', 50);
    
    // Detect files in incorrect directories
    const misplacedFindings = this.detectMisplacedFiles(inventory);
    findings.push(...misplacedFindings);
    
    this.reportProgress(progressCallback, 'Generating move recommendations', 75);
    
    // Generate file move recommendations
    const moveFindings = await this.generateMoveRecommendations(inventory);
    findings.push(...moveFindings);
    
    this.reportProgress(progressCallback, 'Analysis complete', 100);
    
    return {
      analyzer: this.name,
      findings,
      confidence: 'medium',
      riskLevel: 'review' // File moves require careful review
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
    // Roughly 3ms per file for structure analysis
    return inventorySize * 3;
  }

  /**
   * Analyze naming conventions across the codebase
   */
  private analyzeNamingConventions(inventory: FileInventory[]): Finding[] {
    const findings: Finding[] = [];
    
    // Group files by directory and file type
    const directoryGroups = this.groupFilesByDirectory(inventory);
    
    for (const [directory, files] of Object.entries(directoryGroups)) {
      const conventions = this.analyzeDirectoryNamingConventions(files);
      
      // Check for mixed naming conventions in the same directory
      if (conventions.size > 1 && files.length > 2) {
        const conventionCounts = Array.from(conventions.entries())
          .map(([convention, fileList]) => ({ convention, count: fileList.length, files: fileList }))
          .sort((a, b) => b.count - a.count);
        
        const dominantConvention = conventionCounts[0];
        const inconsistentFiles = conventionCounts.slice(1).flatMap(c => c.files);
        
        if (inconsistentFiles.length > 0) {
          findings.push({
            type: 'inconsistent',
            files: inconsistentFiles.map(f => f.path),
            description: `Mixed naming conventions in ${directory}: ${dominantConvention.convention} (${dominantConvention.count} files) vs others`,
            recommendation: `Standardize to ${dominantConvention.convention} convention. Rename: ${inconsistentFiles.map(f => path.basename(f.path)).join(', ')}`,
            autoFixable: false, // Requires import updates
            estimatedSavings: {
              files: 0 // No files removed, just renamed
            }
          });
        }
      }
    }
    
    // Analyze workspace-level naming consistency
    const workspaceFindings = this.analyzeWorkspaceNamingConsistency(inventory);
    findings.push(...workspaceFindings);
    
    return findings;
  }

  /**
   * Analyze directory structure consistency between similar modules
   */
  private analyzeDirectoryStructures(inventory: FileInventory[]): Finding[] {
    const findings: Finding[] = [];
    
    // Group directories by workspace
    const workspaceDirectories = this.groupDirectoriesByWorkspace(inventory);
    
    for (const [workspace, directories] of Object.entries(workspaceDirectories)) {
      if (workspace === 'root') continue; // Skip root workspace
      
      const patterns = this.identifyDirectoryPatterns(directories);
      
      for (const pattern of patterns) {
        if (pattern.inconsistencies.length > 0) {
          findings.push({
            type: 'inconsistent',
            files: pattern.inconsistencies,
            description: `Inconsistent directory structure in ${workspace} workspace`,
            recommendation: `Standardize directory structure. Expected: ${pattern.commonStructure.join(', ')}. Missing or inconsistent: ${pattern.inconsistencies.join(', ')}`,
            autoFixable: false,
            estimatedSavings: {
              files: 0
            }
          });
        }
      }
    }
    
    return findings;
  }

  /**
   * Detect files that are in incorrect directories based on their purpose
   */
  private detectMisplacedFiles(inventory: FileInventory[]): Finding[] {
    const findings: Finding[] = [];
    
    for (const file of inventory) {
      const expectedLocation = this.getExpectedLocation(file);
      
      if (expectedLocation && expectedLocation !== path.dirname(file.path)) {
        const currentDir = path.dirname(file.path);
        
        findings.push({
          type: 'inconsistent',
          files: [file.path],
          description: `File '${path.basename(file.path)}' may be in wrong directory`,
          recommendation: `Consider moving from '${currentDir}' to '${expectedLocation}' based on file type and naming conventions`,
          autoFixable: false,
          estimatedSavings: {
            files: 0
          }
        });
      }
    }
    
    return findings;
  }

  /**
   * Generate file move recommendations with import reference tracking
   */
  private async generateMoveRecommendations(inventory: FileInventory[]): Promise<Finding[]> {
    const findings: Finding[] = [];
    const moveRecommendations: MoveRecommendation[] = [];
    
    // Analyze each file for potential moves
    for (const file of inventory) {
      const recommendations = this.analyzeFileForMoves(file, inventory);
      moveRecommendations.push(...recommendations);
    }
    
    // Group recommendations by target directory
    const groupedMoves = this.groupMoveRecommendations(moveRecommendations);
    
    for (const [targetDir, moves] of Object.entries(groupedMoves)) {
      if (moves.length > 1) {
        // Multiple files should be moved to the same directory
        findings.push({
          type: 'inconsistent',
          files: moves.map(m => m.from),
          description: `Multiple files should be moved to '${targetDir}' for better organization`,
          recommendation: `Move ${moves.length} files to '${targetDir}': ${moves.map(m => path.basename(m.from)).join(', ')}`,
          autoFixable: false,
          estimatedSavings: {
            files: 0
          }
        });
      }
    }
    
    return findings;
  }

  /**
   * Group files by their directory
   */
  private groupFilesByDirectory(inventory: FileInventory[]): Record<string, FileInventory[]> {
    const groups: Record<string, FileInventory[]> = {};
    
    for (const file of inventory) {
      const directory = path.dirname(file.path);
      if (!groups[directory]) {
        groups[directory] = [];
      }
      groups[directory].push(file);
    }
    
    return groups;
  }

  /**
   * Analyze naming conventions within a directory
   */
  private analyzeDirectoryNamingConventions(files: FileInventory[]): Map<NamingConvention, FileInventory[]> {
    const conventions = new Map<NamingConvention, FileInventory[]>();
    
    for (const file of files) {
      const fileName = path.basename(file.path, path.extname(file.path));
      const convention = this.detectNamingConvention(fileName);
      
      if (!conventions.has(convention)) {
        conventions.set(convention, []);
      }
      conventions.get(convention)!.push(file);
    }
    
    return conventions;
  }

  /**
   * Detect the naming convention of a filename
   */
  private detectNamingConvention(fileName: string): NamingConvention {
    // Skip special files
    if (fileName.startsWith('.') || fileName === 'index' || fileName === 'README') {
      return 'mixed'; // Don't enforce conventions on special files
    }
    
    // Check for different patterns
    if (/^[a-z]+([A-Z][a-z]*)*$/.test(fileName)) {
      return 'camelCase';
    }
    
    if (/^[a-z]+(-[a-z]+)*$/.test(fileName)) {
      return 'kebab-case';
    }
    
    if (/^[a-z]+(_[a-z]+)*$/.test(fileName)) {
      return 'snake_case';
    }
    
    if (/^[A-Z][a-z]*([A-Z][a-z]*)*$/.test(fileName)) {
      return 'PascalCase';
    }
    
    if (/^[A-Z]+(_[A-Z]+)*$/.test(fileName)) {
      return 'UPPER_CASE';
    }
    
    return 'mixed';
  }

  /**
   * Analyze workspace-level naming consistency
   */
  private analyzeWorkspaceNamingConsistency(inventory: FileInventory[]): Finding[] {
    const findings: Finding[] = [];
    
    // Group by workspace and file type
    const workspaceGroups: Record<string, Record<string, FileInventory[]>> = {};
    
    for (const file of inventory) {
      if (!workspaceGroups[file.workspace]) {
        workspaceGroups[file.workspace] = {};
      }
      if (!workspaceGroups[file.workspace][file.fileType]) {
        workspaceGroups[file.workspace][file.fileType] = [];
      }
      workspaceGroups[file.workspace][file.fileType].push(file);
    }
    
    // Analyze each workspace for consistency
    for (const [workspace, fileTypes] of Object.entries(workspaceGroups)) {
      for (const [fileType, files] of Object.entries(fileTypes)) {
        if (files.length < 3) continue; // Need enough files to establish a pattern
        
        const conventions = this.analyzeDirectoryNamingConventions(files);
        
        if (conventions.size > 2) { // More than 2 different conventions
          const conventionCounts = Array.from(conventions.entries())
            .map(([convention, fileList]) => ({ convention, count: fileList.length }))
            .sort((a, b) => b.count - a.count);
          
          findings.push({
            type: 'inconsistent',
            files: files.map(f => f.path),
            description: `Inconsistent ${fileType} file naming in ${workspace} workspace: ${conventionCounts.map(c => `${c.convention} (${c.count})`).join(', ')}`,
            recommendation: `Standardize ${fileType} files in ${workspace} to ${conventionCounts[0].convention} convention`,
            autoFixable: false,
            estimatedSavings: {
              files: 0
            }
          });
        }
      }
    }
    
    return findings;
  }

  /**
   * Group directories by workspace for structure analysis
   */
  private groupDirectoriesByWorkspace(inventory: FileInventory[]): Record<string, string[]> {
    const workspaceDirectories: Record<string, Set<string>> = {};
    
    for (const file of inventory) {
      if (!workspaceDirectories[file.workspace]) {
        workspaceDirectories[file.workspace] = new Set();
      }
      
      const directory = path.dirname(file.path);
      workspaceDirectories[file.workspace].add(directory);
    }
    
    // Convert sets to arrays
    const result: Record<string, string[]> = {};
    for (const [workspace, dirSet] of Object.entries(workspaceDirectories)) {
      result[workspace] = Array.from(dirSet);
    }
    
    return result;
  }

  /**
   * Identify common directory patterns and inconsistencies
   */
  private identifyDirectoryPatterns(directories: string[]): DirectoryPattern[] {
    const patterns: DirectoryPattern[] = [];
    
    // Group directories by depth and similarity
    const depthGroups: Record<number, string[]> = {};
    
    for (const dir of directories) {
      const depth = dir.split('/').length;
      if (!depthGroups[depth]) {
        depthGroups[depth] = [];
      }
      depthGroups[depth].push(dir);
    }
    
    // Analyze each depth level for patterns
    for (const [depth, dirs] of Object.entries(depthGroups)) {
      if (dirs.length < 2) continue;
      
      const commonStructure = this.findCommonStructure(dirs);
      const inconsistencies = this.findStructureInconsistencies(dirs, commonStructure);
      
      if (inconsistencies.length > 0) {
        patterns.push({
          pattern: `depth-${depth}`,
          files: dirs,
          commonStructure,
          inconsistencies
        });
      }
    }
    
    return patterns;
  }

  /**
   * Find common structure elements across directories
   */
  private findCommonStructure(directories: string[]): string[] {
    if (directories.length === 0) return [];
    
    const structures = directories.map(dir => dir.split('/'));
    const commonElements: string[] = [];
    
    // Find common path segments
    const maxLength = Math.min(...structures.map(s => s.length));
    
    for (let i = 0; i < maxLength; i++) {
      const segments = structures.map(s => s[i]);
      const uniqueSegments = new Set(segments);
      
      if (uniqueSegments.size === 1) {
        commonElements.push(segments[0]);
      } else {
        // Look for common patterns in segment names
        const patterns = this.findCommonPatterns(Array.from(uniqueSegments));
        if (patterns.length > 0) {
          commonElements.push(`{${patterns.join('|')}}`);
        }
      }
    }
    
    return commonElements;
  }

  /**
   * Find common patterns in directory names
   */
  private findCommonPatterns(names: string[]): string[] {
    const patterns: string[] = [];
    
    // Common directory name patterns
    const commonPatterns = [
      'src', 'lib', 'components', 'utils', 'types', 'services',
      'hooks', 'pages', 'api', 'models', 'controllers', 'middleware',
      '__tests__', 'test', 'tests', 'spec', 'specs'
    ];
    
    for (const pattern of commonPatterns) {
      if (names.some(name => name.includes(pattern))) {
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  /**
   * Find inconsistencies in directory structure
   */
  private findStructureInconsistencies(directories: string[], commonStructure: string[]): string[] {
    const inconsistencies: string[] = [];
    
    for (const dir of directories) {
      const segments = dir.split('/');
      
      // Check if directory follows the common structure
      let hasInconsistency = false;
      
      for (let i = 0; i < commonStructure.length && i < segments.length; i++) {
        const expected = commonStructure[i];
        const actual = segments[i];
        
        if (!expected.startsWith('{') && expected !== actual) {
          hasInconsistency = true;
          break;
        }
      }
      
      if (hasInconsistency || segments.length !== commonStructure.length) {
        inconsistencies.push(dir);
      }
    }
    
    return inconsistencies;
  }

  /**
   * Get expected location for a file based on its type and purpose
   */
  private getExpectedLocation(file: FileInventory): string | null {
    const fileName = path.basename(file.path);
    const currentDir = path.dirname(file.path);
    
    // Test files should be in __tests__ or test directories
    if (file.fileType === 'test') {
      if (!currentDir.includes('__tests__') && !currentDir.includes('test')) {
        const sourceDir = currentDir;
        return path.join(sourceDir, '__tests__');
      }
    }
    
    // Type definition files should be in types directories
    if (fileName.endsWith('.d.ts') || fileName.includes('types')) {
      if (!currentDir.includes('types') && file.workspace !== 'types') {
        return path.join(path.dirname(currentDir), 'types');
      }
    }
    
    // Utility files should be in utils directories
    if (fileName.includes('util') || fileName.includes('helper')) {
      if (!currentDir.includes('utils') && file.workspace !== 'utils') {
        return path.join(path.dirname(currentDir), 'utils');
      }
    }
    
    // Configuration files should be at appropriate levels
    if (file.fileType === 'config') {
      const configFiles = ['tsconfig.json', 'package.json', '.env', 'jest.config.js'];
      if (configFiles.some(cf => fileName.includes(cf))) {
        // These should typically be at workspace root
        const workspaceRoot = this.getWorkspaceRoot(file.workspace);
        if (workspaceRoot && currentDir !== workspaceRoot) {
          return workspaceRoot;
        }
      }
    }
    
    return null;
  }

  /**
   * Get the root directory for a workspace
   */
  private getWorkspaceRoot(workspace: string): string | null {
    const workspaceRoots: Record<string, string> = {
      'backend': 'apps/backend',
      'frontend': 'apps/frontend',
      'shared': 'packages/shared',
      'types': 'packages/types',
      'utils': 'packages/utils',
      'root': '.'
    };
    
    return workspaceRoots[workspace] || null;
  }

  /**
   * Analyze a file for potential move recommendations
   */
  private analyzeFileForMoves(file: FileInventory, inventory: FileInventory[]): MoveRecommendation[] {
    const recommendations: MoveRecommendation[] = [];
    
    // Check if file should be moved based on naming patterns
    const expectedLocation = this.getExpectedLocation(file);
    if (expectedLocation && expectedLocation !== path.dirname(file.path)) {
      const affectedImports = this.findAffectedImports(file, inventory);
      
      recommendations.push({
        from: file.path,
        to: path.join(expectedLocation, path.basename(file.path)),
        reason: 'File type and naming suggest different location',
        affectedImports,
        riskLevel: affectedImports.length > 5 ? 'high' : affectedImports.length > 0 ? 'medium' : 'low'
      });
    }
    
    return recommendations;
  }

  /**
   * Find imports that would be affected by moving a file
   */
  private findAffectedImports(file: FileInventory, inventory: FileInventory[]): string[] {
    const affectedImports: string[] = [];
    
    // This is a simplified implementation
    // In a full implementation, this would parse actual import statements
    const fileName = path.basename(file.path, path.extname(file.path));
    
    for (const otherFile of inventory) {
      if (otherFile.path === file.path) continue;
      
      // Check if the file name appears in the path (simple heuristic)
      if (otherFile.path.includes(fileName)) {
        affectedImports.push(otherFile.path);
      }
    }
    
    return affectedImports;
  }

  /**
   * Group move recommendations by target directory
   */
  private groupMoveRecommendations(recommendations: MoveRecommendation[]): Record<string, MoveRecommendation[]> {
    const groups: Record<string, MoveRecommendation[]> = {};
    
    for (const rec of recommendations) {
      const targetDir = path.dirname(rec.to);
      if (!groups[targetDir]) {
        groups[targetDir] = [];
      }
      groups[targetDir].push(rec);
    }
    
    return groups;
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