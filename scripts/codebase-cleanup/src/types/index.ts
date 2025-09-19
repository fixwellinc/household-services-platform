/**
 * Core type definitions for the codebase cleanup system
 */

export type FileType = 
  | 'typescript' 
  | 'javascript' 
  | 'json' 
  | 'markdown' 
  | 'config' 
  | 'test' 
  | 'asset' 
  | 'other';

export type WorkspaceType = 
  | 'backend' 
  | 'frontend' 
  | 'shared' 
  | 'types' 
  | 'utils' 
  | 'root';

export type FindingType = 
  | 'duplicate' 
  | 'unused' 
  | 'obsolete' 
  | 'inconsistent';

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type RiskLevel = 'safe' | 'review' | 'manual';

/**
 * Represents a file in the codebase inventory
 */
export interface FileInventory {
  /** Relative path from project root */
  path: string;
  /** File size in bytes */
  size: number;
  /** Last modification timestamp */
  lastModified: Date;
  /** SHA-256 hash of file content */
  contentHash: string;
  /** Categorized file type */
  fileType: FileType;
  /** Which workspace/package this file belongs to */
  workspace: WorkspaceType;
}

/**
 * Represents a specific finding from an analyzer
 */
export interface Finding {
  /** Type of issue found */
  type: FindingType;
  /** Files involved in this finding */
  files: string[];
  /** Human-readable description of the issue */
  description: string;
  /** Recommended action to resolve the issue */
  recommendation: string;
  /** Whether this finding can be automatically fixed */
  autoFixable: boolean;
  /** Estimated savings from resolving this finding */
  estimatedSavings?: {
    /** Number of files that would be removed/cleaned */
    files?: number;
    /** Disk space that would be freed (in bytes) */
    size?: number;
    /** Number of dependencies that would be removed */
    dependencies?: number;
  };
}

/**
 * Result from running a specific analyzer
 */
export interface AnalysisResult {
  /** Name of the analyzer that produced this result */
  analyzer: string;
  /** List of findings from this analyzer */
  findings: Finding[];
  /** Confidence level in the analysis results */
  confidence: ConfidenceLevel;
  /** Risk level of applying the suggested changes */
  riskLevel: RiskLevel;
}

/**
 * Comprehensive report of all cleanup analysis
 */
export interface CleanupReport {
  /** High-level summary statistics */
  summary: {
    /** Total number of files analyzed */
    totalFiles: number;
    /** Total number of findings across all analyzers */
    totalFindings: number;
    /** Estimated savings from applying all recommendations */
    estimatedSavings: {
      /** Total files that would be removed/cleaned */
      files: number;
      /** Total disk space that would be freed */
      diskSpace: string;
      /** Total dependencies that would be removed */
      dependencies: number;
    };
  };
  /** Results organized by analyzer category */
  categories: {
    [analyzerName: string]: AnalysisResult;
  };
  /** All recommendations sorted by priority/impact */
  recommendations: Finding[];
}

/**
 * Configuration options for the cleanup system
 */
export interface CleanupConfig {
  /** Directories to exclude from analysis */
  excludePatterns: string[];
  /** File patterns to include in analysis */
  includePatterns: string[];
  /** Whether to create backups before making changes */
  createBackups: boolean;
  /** Whether to run in dry-run mode (no actual changes) */
  dryRun: boolean;
  /** Minimum confidence level for auto-fixes */
  autoFixConfidence: ConfidenceLevel;
  /** Maximum risk level for auto-fixes */
  autoFixRiskLevel: RiskLevel;
}

/**
 * Progress information for long-running operations
 */
export interface ProgressInfo {
  /** Current step being executed */
  currentStep: string;
  /** Number of completed steps */
  completedSteps: number;
  /** Total number of steps */
  totalSteps: number;
  /** Percentage complete (0-100) */
  percentage: number;
  /** Optional additional details */
  details?: string;
}

/**
 * Base interface that all analyzers must implement
 */
export interface Analyzer {
  /** Unique name identifier for this analyzer */
  readonly name: string;
  
  /** Human-readable description of what this analyzer does */
  readonly description: string;
  
  /** 
   * Analyze the provided file inventory and return findings
   * @param inventory - Complete file inventory from FileScanner
   * @param progressCallback - Optional callback for progress updates
   * @returns Promise resolving to analysis results
   */
  analyze(
    inventory: FileInventory[], 
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<AnalysisResult>;
  
  /**
   * Validate that this analyzer can run with the current configuration
   * @returns Promise resolving to true if analyzer can run, false otherwise
   */
  canRun(): Promise<boolean>;
  
  /**
   * Get estimated time this analyzer will take to complete (in milliseconds)
   * @param inventorySize - Number of files in the inventory
   * @returns Estimated completion time in milliseconds
   */
  getEstimatedTime(inventorySize: number): number;
}

/**
 * Error information for failed analyzer execution
 */
export interface AnalyzerError {
  /** Name of the analyzer that failed */
  analyzerName: string;
  /** Error message */
  message: string;
  /** Original error object if available */
  originalError?: Error;
  /** Whether this error is recoverable */
  recoverable: boolean;
}

/**
 * Overall orchestration result containing all analyzer results and any errors
 */
export interface OrchestrationResult {
  /** Successfully completed analyzer results */
  results: AnalysisResult[];
  /** Any errors that occurred during analysis */
  errors: AnalyzerError[];
  /** Total time taken for all analysis (in milliseconds) */
  totalTime: number;
  /** Whether the orchestration completed successfully */
  success: boolean;
}

/**
 * Types of changes that can be executed
 */
export type ChangeType = 
  | 'delete_file'
  | 'move_file'
  | 'modify_file'
  | 'create_file'
  | 'update_package_json';

/**
 * Represents a single change to be executed
 */
export interface Change {
  /** Unique identifier for this change */
  id: string;
  /** Type of change operation */
  type: ChangeType;
  /** Description of what this change does */
  description: string;
  /** Source file path (for moves, deletes, modifications) */
  sourcePath?: string;
  /** Target file path (for moves, creates, modifications) */
  targetPath?: string;
  /** New content for file modifications/creations */
  content?: string;
  /** Original content (for rollback purposes) */
  originalContent?: string;
  /** Risk level of this change */
  riskLevel: RiskLevel;
  /** Whether this change can be automatically applied */
  autoApplicable: boolean;
  /** Finding that generated this change */
  findingId?: string;
}

/**
 * Result of executing a single change
 */
export interface ChangeResult {
  /** The change that was executed */
  change: Change;
  /** Whether the change was successful */
  success: boolean;
  /** Error message if the change failed */
  error?: string;
  /** Path to backup file if one was created */
  backupPath?: string;
  /** Timestamp when the change was executed */
  executedAt: Date;
}

/**
 * Backup information for rollback purposes
 */
export interface BackupInfo {
  /** Original file path */
  originalPath: string;
  /** Path to backup file */
  backupPath: string;
  /** Timestamp when backup was created */
  createdAt: Date;
  /** Type of change that required this backup */
  changeType: ChangeType;
  /** Change ID that created this backup */
  changeId: string;
}

/**
 * Execution plan containing all changes to be applied
 */
export interface ExecutionPlan {
  /** List of changes to execute */
  changes: Change[];
  /** Estimated total execution time */
  estimatedTime: number;
  /** Total number of files that will be affected */
  affectedFiles: number;
  /** Breakdown by risk level */
  riskBreakdown: {
    safe: number;
    review: number;
    manual: number;
  };
}

/**
 * Result of executing an entire plan
 */
export interface ExecutionResult {
  /** The plan that was executed */
  plan: ExecutionPlan;
  /** Results for each individual change */
  changeResults: ChangeResult[];
  /** List of backups created during execution */
  backups: BackupInfo[];
  /** Whether execution completed successfully */
  success: boolean;
  /** Total execution time in milliseconds */
  executionTime: number;
  /** Summary statistics */
  summary: {
    totalChanges: number;
    successfulChanges: number;
    failedChanges: number;
    filesModified: number;
    backupsCreated: number;
  };
}

/**
 * Options for change execution
 */
export interface ExecutionOptions {
  /** Whether to run in dry-run mode (no actual changes) */
  dryRun: boolean;
  /** Whether to create backups before making changes */
  createBackups: boolean;
  /** Whether to continue execution if individual changes fail */
  continueOnError: boolean;
  /** Maximum risk level to execute automatically */
  maxAutoRiskLevel: RiskLevel;
  /** Callback for progress updates */
  progressCallback?: (progress: ProgressInfo) => void;
  /** Callback for change confirmation in interactive mode */
  confirmCallback?: (change: Change) => Promise<boolean>;
}