import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';
import ignore from 'ignore';
import { FileInventory, FileType, WorkspaceType, ProgressInfo } from '../types';

/**
 * Configuration for file scanning optimization
 */
export interface ScannerConfig {
  /** Enable parallel file processing (default: true) */
  enableParallel?: boolean;
  /** Maximum number of parallel workers (default: CPU cores) */
  maxWorkers?: number;
  /** Memory limit per batch in MB (default: 256MB) */
  memoryLimitMB?: number;
  /** Batch size for parallel processing (default: 50) */
  batchSize?: number;
  /** Enable memory optimization (default: true) */
  enableMemoryOptimization?: boolean;
}

/**
 * Core file scanning system that recursively traverses the monorepo
 * and builds a comprehensive inventory of all files with metadata
 */
export class FileScanner {
  private ignoreFilter: ReturnType<typeof ignore>;
  private progressCallback?: (progress: ProgressInfo) => void;
  private scannedFiles = 0;
  private totalFiles = 0;
  private config: Required<ScannerConfig>;

  constructor(
    private rootPath: string,
    progressCallback?: (progress: ProgressInfo) => void,
    config: ScannerConfig = {}
  ) {
    this.rootPath = path.resolve(rootPath);
    this.progressCallback = progressCallback;
    this.ignoreFilter = ignore();
    this.config = {
      enableParallel: config.enableParallel ?? true,
      maxWorkers: config.maxWorkers ?? Math.min(os.cpus().length, 4),
      memoryLimitMB: config.memoryLimitMB ?? 256,
      batchSize: config.batchSize ?? 50,
      enableMemoryOptimization: config.enableMemoryOptimization ?? true
    };
    this.loadGitignorePatterns();
  }

  /**
   * Load .gitignore patterns from the repository root and add default exclusions
   */
  private loadGitignorePatterns(): void {
    const gitignorePath = path.join(this.rootPath, '.gitignore');
    
    // Add default patterns that should always be ignored
    const defaultPatterns = [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '*.log',
      '.DS_Store',
      'Thumbs.db',
      '*.tmp',
      '*.temp',
      '.cache/**',
      'coverage/**'
    ];

    this.ignoreFilter.add(defaultPatterns);

    // Load patterns from .gitignore if it exists
    if (fs.existsSync(gitignorePath)) {
      try {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        const patterns = gitignoreContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'));
        
        this.ignoreFilter.add(patterns);
      } catch (error) {
        console.warn(`Warning: Could not read .gitignore file: ${error}`);
      }
    }
  }

  /**
   * Scan the entire monorepo and return a comprehensive file inventory
   */
  async scanRepository(): Promise<FileInventory[]> {
    const inventory: FileInventory[] = [];
    
    // First pass: count total files for progress reporting
    this.totalFiles = await this.countFiles(this.rootPath);
    this.scannedFiles = 0;

    this.reportProgress('Starting file scan', 0);

    if (this.config.enableParallel && this.totalFiles > this.config.batchSize) {
      await this.scanRepositoryParallel(inventory);
    } else {
      await this.scanDirectory(this.rootPath, inventory);
    }

    this.reportProgress('File scan complete', 100);
    
    return inventory;
  }

  /**
   * Scan repository using parallel processing for better performance
   */
  private async scanRepositoryParallel(inventory: FileInventory[]): Promise<void> {
    // Collect all file paths first
    const filePaths = await this.collectAllFilePaths(this.rootPath);
    
    // Process files in batches
    const batches = this.createFileBatches(filePaths);
    
    this.reportProgress('Processing files in parallel batches', 0);

    let processedBatches = 0;
    const totalBatches = batches.length;

    // Process batches with limited concurrency
    const semaphore = new Semaphore(this.config.maxWorkers);
    
    const batchPromises = batches.map(async (batch, batchIndex) => {
      await semaphore.acquire();
      
      try {
        const batchResults = await this.processBatch(batch);
        inventory.push(...batchResults);
        
        processedBatches++;
        const percentage = Math.round((processedBatches / totalBatches) * 100);
        this.reportProgress(
          `Processed batch ${processedBatches}/${totalBatches}`, 
          percentage
        );

        // Force garbage collection between batches if enabled
        if (this.config.enableMemoryOptimization && global.gc) {
          global.gc();
        }
      } finally {
        semaphore.release();
      }
    });

    await Promise.all(batchPromises);
  }

  /**
   * Collect all file paths without analyzing them
   */
  private async collectAllFilePaths(dirPath: string): Promise<string[]> {
    const filePaths: string[] = [];
    
    const collectFromDirectory = async (currentPath: string): Promise<void> => {
      try {
        const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          const relativePath = path.relative(this.rootPath, fullPath);
          
          if (this.shouldIgnore(relativePath)) {
            continue;
          }

          if (entry.isDirectory()) {
            await collectFromDirectory(fullPath);
          } else if (entry.isFile()) {
            filePaths.push(fullPath);
          }
        }
      } catch (error) {
        // Silently skip directories we can't read
      }
    };

    await collectFromDirectory(dirPath);
    return filePaths;
  }

  /**
   * Create batches of file paths for parallel processing
   */
  private createFileBatches(filePaths: string[]): string[][] {
    const batches: string[][] = [];
    const batchSize = this.config.batchSize;

    for (let i = 0; i < filePaths.length; i += batchSize) {
      batches.push(filePaths.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Process a batch of files in parallel
   */
  private async processBatch(filePaths: string[]): Promise<FileInventory[]> {
    const batchResults: FileInventory[] = [];
    
    // Process files in the batch concurrently
    const filePromises = filePaths.map(async (fullPath) => {
      const relativePath = path.relative(this.rootPath, fullPath);
      const fileInfo = await this.analyzeFile(fullPath, relativePath);
      
      if (fileInfo) {
        batchResults.push(fileInfo);
      }
      
      this.scannedFiles++;
    });

    await Promise.all(filePromises);
    return batchResults;
  }

  /**
   * Count total files for progress reporting
   */
  private async countFiles(dirPath: string): Promise<number> {
    let count = 0;
    
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.rootPath, fullPath);
        
        if (this.shouldIgnore(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          count += await this.countFiles(fullPath);
        } else if (entry.isFile()) {
          count++;
        }
      }
    } catch (error) {
      // Silently skip directories we can't read
    }
    
    return count;
  }

  /**
   * Recursively scan a directory and add files to inventory
   */
  private async scanDirectory(dirPath: string, inventory: FileInventory[]): Promise<void> {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.rootPath, fullPath);
        
        if (this.shouldIgnore(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, inventory);
        } else if (entry.isFile()) {
          const fileInfo = await this.analyzeFile(fullPath, relativePath);
          if (fileInfo) {
            inventory.push(fileInfo);
          }
          
          this.scannedFiles++;
          if (this.scannedFiles % 100 === 0) {
            const percentage = Math.round((this.scannedFiles / this.totalFiles) * 100);
            this.reportProgress(`Scanned ${this.scannedFiles} files`, percentage);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dirPath}: ${error}`);
    }
  }

  /**
   * Check if a file path should be ignored based on .gitignore patterns
   */
  private shouldIgnore(relativePath: string): boolean {
    // Normalize path separators for cross-platform compatibility
    const normalizedPath = relativePath.replace(/\\/g, '/');
    
    // Always ignore .gitignore file itself
    if (normalizedPath === '.gitignore') {
      return true;
    }
    
    const shouldIgnore = this.ignoreFilter.ignores(normalizedPath);
    return shouldIgnore;
  }

  /**
   * Analyze a single file and create FileInventory entry
   */
  private async analyzeFile(fullPath: string, relativePath: string): Promise<FileInventory | null> {
    try {
      const stats = await fs.promises.stat(fullPath);
      
      // Skip very large files (>100MB) to avoid memory issues
      if (stats.size > 100 * 1024 * 1024) {
        console.warn(`Skipping large file: ${relativePath} (${stats.size} bytes)`);
        return null;
      }

      const content = await fs.promises.readFile(fullPath);
      const contentHash = this.calculateContentHash(content);
      const fileType = this.determineFileType(relativePath);
      const workspace = this.determineWorkspace(relativePath);

      return {
        path: relativePath,
        size: stats.size,
        lastModified: stats.mtime,
        contentHash,
        fileType,
        workspace
      };
    } catch (error) {
      console.warn(`Warning: Could not analyze file ${relativePath}: ${error}`);
      return null;
    }
  }

  /**
   * Calculate SHA-256 hash of file content for duplicate detection
   */
  private calculateContentHash(content: Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Determine file type based on extension and path patterns
   */
  private determineFileType(filePath: string): FileType {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath).toLowerCase();
    
    // Test files
    if (filePath.includes('__tests__') || 
        filePath.includes('.test.') || 
        filePath.includes('.spec.') ||
        basename.includes('test') ||
        basename.includes('spec')) {
      return 'test';
    }

    // Configuration files
    if (basename.startsWith('.') || 
        ['json', 'yml', 'yaml', 'toml', 'ini', 'conf'].includes(ext.slice(1)) ||
        basename.includes('config') ||
        basename.includes('tsconfig') ||
        basename.includes('package.json') ||
        basename.includes('dockerfile')) {
      return 'config';
    }

    // Source code files
    switch (ext) {
      case '.ts':
      case '.tsx':
        return 'typescript';
      case '.js':
      case '.jsx':
      case '.mjs':
      case '.cjs':
        return 'javascript';
      case '.json':
        return 'json';
      case '.md':
      case '.markdown':
        return 'markdown';
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.gif':
      case '.svg':
      case '.ico':
      case '.css':
      case '.scss':
      case '.sass':
      case '.less':
        return 'asset';
      default:
        return 'other';
    }
  }

  /**
   * Determine which workspace/package a file belongs to
   */
  private determineWorkspace(filePath: string): WorkspaceType {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    if (normalizedPath.startsWith('apps/backend/')) {
      return 'backend';
    }
    if (normalizedPath.startsWith('apps/frontend/')) {
      return 'frontend';
    }
    if (normalizedPath.startsWith('packages/shared/')) {
      return 'shared';
    }
    if (normalizedPath.startsWith('packages/types/')) {
      return 'types';
    }
    if (normalizedPath.startsWith('packages/utils/')) {
      return 'utils';
    }
    
    return 'root';
  }

  /**
   * Report progress to callback if provided
   */
  private reportProgress(step: string, percentage: number): void {
    if (this.progressCallback) {
      this.progressCallback({
        currentStep: step,
        completedSteps: this.scannedFiles,
        totalSteps: this.totalFiles,
        percentage,
        details: `${this.scannedFiles}/${this.totalFiles} files processed`
      });
    }
  }
}

/**
 * Semaphore for controlling concurrency
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      this.permits--;
      resolve();
    }
  }
}