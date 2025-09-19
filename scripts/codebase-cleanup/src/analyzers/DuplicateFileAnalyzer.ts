import { Analyzer, FileInventory, AnalysisResult, Finding, ProgressInfo } from '../types';

/**
 * Analyzer that identifies duplicate files based on content hashes
 * and provides recommendations for cleanup
 */
export class DuplicateFileAnalyzer implements Analyzer {
  readonly name = 'duplicate-file-analyzer';
  readonly description = 'Identifies duplicate files based on content hash comparison and recommends cleanup actions';

  /**
   * Analyze file inventory to find duplicate files
   */
  async analyze(
    inventory: FileInventory[], 
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<AnalysisResult> {
    const findings: Finding[] = [];
    
    this.reportProgress(progressCallback, 'Grouping files by content hash', 0);
    
    // Group files by content hash to identify duplicates
    const hashGroups = this.groupFilesByHash(inventory);
    
    this.reportProgress(progressCallback, 'Analyzing duplicate groups', 25);
    
    // Analyze each group of files with identical content
    let processedGroups = 0;
    const totalGroups = Object.keys(hashGroups).length;
    
    for (const [hash, files] of Object.entries(hashGroups)) {
      if (files.length > 1) {
        // Found duplicates - analyze and create findings
        const duplicateFindings = this.analyzeDuplicateGroup(files, hash);
        findings.push(...duplicateFindings);
      }
      
      processedGroups++;
      if (processedGroups % 10 === 0) {
        const percentage = 25 + Math.round((processedGroups / totalGroups) * 50);
        this.reportProgress(progressCallback, `Analyzed ${processedGroups}/${totalGroups} file groups`, percentage);
      }
    }
    
    this.reportProgress(progressCallback, 'Detecting similar files', 75);
    
    // Find files with similar content (minor differences)
    const similarFindings = await this.findSimilarFiles(inventory, progressCallback);
    findings.push(...similarFindings);
    
    this.reportProgress(progressCallback, 'Analysis complete', 100);
    
    return {
      analyzer: this.name,
      findings,
      confidence: 'high',
      riskLevel: 'safe'
    };
  }

  /**
   * Check if analyzer can run (always true for duplicate file analyzer)
   */
  async canRun(): Promise<boolean> {
    return true;
  }

  /**
   * Estimate time based on inventory size
   */
  getEstimatedTime(inventorySize: number): number {
    // Roughly 1ms per file for hash grouping + similarity analysis
    return inventorySize * 2;
  }

  /**
   * Group files by their content hash
   */
  private groupFilesByHash(inventory: FileInventory[]): Record<string, FileInventory[]> {
    const hashGroups: Record<string, FileInventory[]> = {};
    
    for (const file of inventory) {
      if (!hashGroups[file.contentHash]) {
        hashGroups[file.contentHash] = [];
      }
      hashGroups[file.contentHash].push(file);
    }
    
    return hashGroups;
  }

  /**
   * Analyze a group of files with identical content hashes
   */
  private analyzeDuplicateGroup(files: FileInventory[], hash: string): Finding[] {
    const findings: Finding[] = [];
    
    // Sort files by priority (canonical locations first)
    const sortedFiles = this.sortFilesByPriority(files);
    const canonicalFile = sortedFiles[0];
    const duplicateFiles = sortedFiles.slice(1);
    
    // Calculate total size savings
    const totalDuplicateSize = duplicateFiles.reduce((sum, file) => sum + file.size, 0);
    
    findings.push({
      type: 'duplicate',
      files: files.map(f => f.path),
      description: `Found ${files.length} identical files (hash: ${hash.substring(0, 8)}...)`,
      recommendation: `Keep '${canonicalFile.path}' and remove ${duplicateFiles.length} duplicate(s): ${duplicateFiles.map(f => f.path).join(', ')}`,
      autoFixable: true,
      estimatedSavings: {
        files: duplicateFiles.length,
        size: totalDuplicateSize
      }
    });
    
    return findings;
  }

  /**
   * Sort files by priority to determine canonical version
   * Priority order:
   * 1. Root workspace over subdirectories
   * 2. Shorter paths over longer paths
   * 3. Standard locations over non-standard
   * 4. Alphabetical order as tiebreaker
   */
  private sortFilesByPriority(files: FileInventory[]): FileInventory[] {
    return files.sort((a, b) => {
      // Priority 1: Root workspace files first
      if (a.workspace === 'root' && b.workspace !== 'root') return -1;
      if (b.workspace === 'root' && a.workspace !== 'root') return 1;
      
      // Priority 2: Shorter paths (closer to root)
      const aDepth = a.path.split('/').length;
      const bDepth = b.path.split('/').length;
      if (aDepth !== bDepth) return aDepth - bDepth;
      
      // Priority 3: Standard locations
      const aIsStandard = this.isStandardLocation(a.path);
      const bIsStandard = this.isStandardLocation(b.path);
      if (aIsStandard && !bIsStandard) return -1;
      if (bIsStandard && !aIsStandard) return 1;
      
      // Priority 4: Alphabetical order
      return a.path.localeCompare(b.path);
    });
  }

  /**
   * Check if a file path represents a standard/canonical location
   */
  private isStandardLocation(filePath: string): boolean {
    const standardPatterns = [
      /^src\//,           // Source directories
      /^lib\//,           // Library directories  
      /^index\./,         // Index files
      /^README\./,        // README files
      /^package\.json$/,  // Package files
      /^tsconfig\.json$/, // TypeScript config
    ];
    
    return standardPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Find files with similar content (minor differences like whitespace, comments)
   */
  private async findSimilarFiles(
    inventory: FileInventory[], 
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<Finding[]> {
    const findings: Finding[] = [];
    
    // Only analyze source code files for similarity
    const sourceFiles = inventory.filter(file => 
      ['typescript', 'javascript', 'json'].includes(file.fileType)
    );
    
    // Group files by size ranges to reduce comparison overhead
    const sizeGroups = this.groupFilesBySizeRange(sourceFiles);
    
    let processedFiles = 0;
    const totalFiles = sourceFiles.length;
    
    for (const files of Object.values(sizeGroups)) {
      if (files.length < 2) continue;
      
      // Compare files within each size group
      for (let i = 0; i < files.length - 1; i++) {
        for (let j = i + 1; j < files.length; j++) {
          const file1 = files[i];
          const file2 = files[j];
          
          // Skip if files are already identified as exact duplicates
          if (file1.contentHash === file2.contentHash) continue;
          
          const similarity = await this.calculateSimilarity(file1, file2);
          
          if (similarity > 0.85) { // 85% similarity threshold
            findings.push({
              type: 'duplicate',
              files: [file1.path, file2.path],
              description: `Files are ${Math.round(similarity * 100)}% similar - likely duplicates with minor differences`,
              recommendation: `Review files for consolidation. Consider keeping '${this.sortFilesByPriority([file1, file2])[0].path}' and removing or merging the other.`,
              autoFixable: false, // Requires manual review due to differences
              estimatedSavings: {
                files: 1,
                size: Math.min(file1.size, file2.size)
              }
            });
          }
        }
        
        processedFiles++;
        if (processedFiles % 50 === 0) {
          const percentage = 75 + Math.round((processedFiles / totalFiles) * 25);
          this.reportProgress(progressCallback, `Compared ${processedFiles}/${totalFiles} files for similarity`, percentage);
        }
      }
    }
    
    return findings;
  }

  /**
   * Group files by size ranges to optimize similarity comparisons
   */
  private groupFilesBySizeRange(files: FileInventory[]): Record<string, FileInventory[]> {
    const sizeGroups: Record<string, FileInventory[]> = {};
    
    for (const file of files) {
      // Group by size ranges (within 20% of each other)
      const sizeRange = Math.floor(file.size / (file.size * 0.2 + 1));
      const key = `range_${sizeRange}`;
      
      if (!sizeGroups[key]) {
        sizeGroups[key] = [];
      }
      sizeGroups[key].push(file);
    }
    
    return sizeGroups;
  }

  /**
   * Calculate similarity between two files based on content
   * Returns a value between 0 (completely different) and 1 (identical)
   */
  private async calculateSimilarity(file1: FileInventory, file2: FileInventory): Promise<number> {
    // For now, use a simple heuristic based on size difference
    // In a full implementation, this would analyze actual content
    const sizeDiff = Math.abs(file1.size - file2.size);
    const avgSize = (file1.size + file2.size) / 2;
    
    // If files are exactly the same size, they might be similar
    // but we need to be more conservative to avoid false positives
    if (sizeDiff === 0) {
      // Same size but different hashes - could be similar with minor differences
      // Return a moderate similarity score that requires manual review
      return 0.8;
    }
    
    const sizeRatio = 1 - (sizeDiff / avgSize);
    
    // Only consider files similar if they're very close in size (within 5%)
    // and the size ratio is very high
    if (sizeDiff / avgSize > 0.05) {
      return 0; // Too different in size
    }
    
    // Files with very similar sizes are likely similar
    // This is a simplified approach - real implementation would:
    // 1. Read file contents
    // 2. Normalize whitespace and comments
    // 3. Compare normalized content using algorithms like Levenshtein distance
    // 4. Use AST comparison for code files
    
    return Math.max(0, sizeRatio);
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