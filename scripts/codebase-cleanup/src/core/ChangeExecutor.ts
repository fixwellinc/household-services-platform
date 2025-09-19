import * as fs from 'fs';
import * as path from 'path';
import { 
  Change, 
  ChangeResult, 
  BackupInfo, 
  ExecutionPlan, 
  ExecutionResult, 
  ExecutionOptions,
  RiskLevel
} from '../types';
import { SafetyManager, SafetyConfig } from './SafetyManager';

/**
 * Handles the execution of changes with backup and rollback capabilities
 */
export class ChangeExecutor {
  private backupDir: string;
  private changeLog: ChangeResult[] = [];
  private backups: BackupInfo[] = [];
  private safetyManager: SafetyManager;

  constructor(backupDir: string = '.cleanup-backups', safetyConfig?: Partial<SafetyConfig>) {
    this.backupDir = path.resolve(backupDir);
    this.safetyManager = new SafetyManager(safetyConfig);
  }

  /**
   * Create an execution plan from a list of changes
   */
  async createExecutionPlan(changes: Change[]): Promise<ExecutionPlan> {
    const riskBreakdown = {
      safe: changes.filter(c => c.riskLevel === 'safe').length,
      review: changes.filter(c => c.riskLevel === 'review').length,
      manual: changes.filter(c => c.riskLevel === 'manual').length
    };

    const affectedFiles = new Set<string>();
    changes.forEach(change => {
      if (change.sourcePath) affectedFiles.add(change.sourcePath);
      if (change.targetPath) affectedFiles.add(change.targetPath);
    });

    return {
      changes,
      estimatedTime: changes.length * 100, // Rough estimate: 100ms per change
      affectedFiles: affectedFiles.size,
      riskBreakdown
    };
  }

  /**
   * Execute a plan with the given options
   */
  async executePlan(plan: ExecutionPlan, options: ExecutionOptions): Promise<ExecutionResult> {
    const startTime = Date.now();
    this.changeLog = [];
    this.backups = [];

    // Perform batch safety check first - only fail on truly unsafe changes
    const batchSafetyCheck = await this.safetyManager.checkBatchSafety(plan.changes);
    if (!batchSafetyCheck.safe && batchSafetyCheck.riskLevel === 'manual') {
      // Only throw for truly unsafe changes, not just high-risk ones
      const unsafeChanges = [];
      for (const change of plan.changes) {
        const individualCheck = await this.safetyManager.checkChangeSafety(change);
        if (!individualCheck.safe) {
          unsafeChanges.push(change);
        }
      }
      if (unsafeChanges.length > 0) {
        throw new Error(`Batch safety check failed: ${batchSafetyCheck.reason}`);
      }
    }

    // Ensure backup directory exists if backups are enabled
    if (options.createBackups && !options.dryRun) {
      await this.ensureBackupDirectory();
    }

    const changeResults: ChangeResult[] = [];
    let successfulChanges = 0;
    let failedChanges = 0;

    for (let i = 0; i < plan.changes.length; i++) {
      const change = plan.changes[i];
      
      // Report progress
      if (options.progressCallback) {
        options.progressCallback({
          currentStep: `Executing change: ${change.description}`,
          completedSteps: i,
          totalSteps: plan.changes.length,
          percentage: Math.round((i / plan.changes.length) * 100),
          details: `Processing ${change.type} operation`
        });
      }

      // Perform individual safety check
      const safetyCheck = await this.safetyManager.checkChangeSafety(change);
      if (!safetyCheck.safe) {
        const result: ChangeResult = {
          change,
          success: false,
          error: `Safety check failed: ${safetyCheck.reason}`,
          executedAt: new Date()
        };
        changeResults.push(result);
        failedChanges++;
        continue;
      }

      // Check if we should execute this change based on risk level
      if (!this.shouldExecuteChange(change, options)) {
        const result: ChangeResult = {
          change,
          success: false,
          error: `Skipped: Risk level ${change.riskLevel} exceeds maximum ${options.maxAutoRiskLevel}`,
          executedAt: new Date()
        };
        changeResults.push(result);
        failedChanges++;
        continue;
      }

      // Ask for confirmation if required by safety check or callback is provided
      const needsConfirmation = safetyCheck.requiresConfirmation || (options.confirmCallback && !options.dryRun);
      if (needsConfirmation && options.confirmCallback) {
        const confirmed = await options.confirmCallback(change);
        if (!confirmed) {
          const result: ChangeResult = {
            change,
            success: false,
            error: 'User declined to execute change',
            executedAt: new Date()
          };
          changeResults.push(result);
          failedChanges++;
          continue;
        }
      }

      try {
        const result = await this.executeChange(change, options);
        changeResults.push(result);
        this.changeLog.push(result);

        if (result.success) {
          successfulChanges++;
        } else {
          failedChanges++;
          if (!options.continueOnError) {
            break;
          }
        }
      } catch (error) {
        const result: ChangeResult = {
          change,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          executedAt: new Date()
        };
        changeResults.push(result);
        this.changeLog.push(result);
        failedChanges++;

        if (!options.continueOnError) {
          break;
        }
      }
    }

    const executionTime = Date.now() - startTime;
    const filesModified = new Set(
      changeResults
        .filter(r => r.success)
        .map(r => r.change.sourcePath || r.change.targetPath)
        .filter(Boolean)
    ).size;

    return {
      plan,
      changeResults,
      backups: this.backups,
      success: failedChanges === 0,
      executionTime,
      summary: {
        totalChanges: plan.changes.length,
        successfulChanges,
        failedChanges,
        filesModified,
        backupsCreated: this.backups.length
      }
    };
  }

  /**
   * Execute a single change
   */
  private async executeChange(change: Change, options: ExecutionOptions): Promise<ChangeResult> {
    const result: ChangeResult = {
      change,
      success: false,
      executedAt: new Date()
    };

    try {
      if (options.dryRun) {
        // In dry-run mode, just validate the change without executing
        await this.validateChange(change);
        result.success = true;
        return result;
      }

      // Create backup if needed
      if (options.createBackups && this.needsBackup(change)) {
        result.backupPath = await this.createBackup(change);
      }

      // Execute the actual change
      switch (change.type) {
        case 'delete_file':
          await this.deleteFile(change);
          break;
        case 'move_file':
          await this.moveFile(change);
          break;
        case 'modify_file':
          await this.modifyFile(change);
          break;
        case 'create_file':
          await this.createFile(change);
          break;
        case 'update_package_json':
          await this.updatePackageJson(change);
          break;
        default:
          throw new Error(`Unsupported change type: ${change.type}`);
      }

      result.success = true;
    } catch (error) {
      if (error instanceof Error) {
        result.error = error.message;
      } else {
        result.error = `Unknown error: ${String(error)}`;
      }
      
      // If we created a backup and the change failed, we should restore it
      if (result.backupPath && !options.dryRun) {
        try {
          await this.restoreFromBackup(result.backupPath, change.sourcePath!);
        } catch (restoreError) {
          const restoreMsg = restoreError instanceof Error ? restoreError.message : 'Unknown restore error';
          result.error += ` (Failed to restore backup: ${restoreMsg})`;
        }
      }
    }

    return result;
  }

  /**
   * Validate that a change can be executed
   */
  private async validateChange(change: Change): Promise<void> {
    switch (change.type) {
      case 'delete_file':
        if (!change.sourcePath) {
          throw new Error('Delete operation requires sourcePath');
        }
        if (!await this.fileExists(change.sourcePath)) {
          throw new Error(`File to delete does not exist: ${change.sourcePath}`);
        }
        break;

      case 'move_file':
        if (!change.sourcePath || !change.targetPath) {
          throw new Error('Move operation requires both sourcePath and targetPath');
        }
        if (!await this.fileExists(change.sourcePath)) {
          throw new Error(`Source file does not exist: ${change.sourcePath}`);
        }
        if (await this.fileExists(change.targetPath)) {
          throw new Error(`Target file already exists: ${change.targetPath}`);
        }
        break;

      case 'modify_file':
        if (!change.sourcePath || change.content === undefined) {
          throw new Error('Modify operation requires sourcePath and content');
        }
        if (!await this.fileExists(change.sourcePath)) {
          throw new Error(`File to modify does not exist: ${change.sourcePath}`);
        }
        break;

      case 'create_file':
        if (!change.targetPath || change.content === undefined) {
          throw new Error('Create operation requires targetPath and content');
        }
        if (await this.fileExists(change.targetPath)) {
          throw new Error(`Target file already exists: ${change.targetPath}`);
        }
        break;

      case 'update_package_json':
        if (!change.sourcePath || change.content === undefined) {
          throw new Error('Package.json update requires sourcePath and content');
        }
        if (!await this.fileExists(change.sourcePath)) {
          throw new Error(`Package.json file does not exist: ${change.sourcePath}`);
        }
        // Validate that content is valid JSON
        try {
          JSON.parse(change.content);
        } catch {
          throw new Error('Invalid JSON content for package.json update');
        }
        break;
    }
  }

  /**
   * Delete a file
   */
  private async deleteFile(change: Change): Promise<void> {
    if (!change.sourcePath) {
      throw new Error('Delete operation requires sourcePath');
    }
    try {
      await fs.promises.unlink(change.sourcePath);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to delete file: ${String(error)}`);
    }
  }

  /**
   * Move a file
   */
  private async moveFile(change: Change): Promise<void> {
    if (!change.sourcePath || !change.targetPath) {
      throw new Error('Move operation requires both sourcePath and targetPath');
    }
    
    // Ensure target directory exists
    const targetDir = path.dirname(change.targetPath);
    await fs.promises.mkdir(targetDir, { recursive: true });
    
    await fs.promises.rename(change.sourcePath, change.targetPath);
  }

  /**
   * Modify a file's content
   */
  private async modifyFile(change: Change): Promise<void> {
    if (!change.sourcePath || change.content === undefined) {
      throw new Error('Modify operation requires sourcePath and content');
    }
    await fs.promises.writeFile(change.sourcePath, change.content, 'utf8');
  }

  /**
   * Create a new file
   */
  private async createFile(change: Change): Promise<void> {
    if (!change.targetPath || change.content === undefined) {
      throw new Error('Create operation requires targetPath and content');
    }
    
    // Ensure target directory exists
    const targetDir = path.dirname(change.targetPath);
    await fs.promises.mkdir(targetDir, { recursive: true });
    
    await fs.promises.writeFile(change.targetPath, change.content, 'utf8');
  }

  /**
   * Update package.json with new content
   */
  private async updatePackageJson(change: Change): Promise<void> {
    if (!change.sourcePath || change.content === undefined) {
      throw new Error('Package.json update requires sourcePath and content');
    }
    
    // Validate JSON before writing
    const parsed = JSON.parse(change.content);
    const formatted = JSON.stringify(parsed, null, 2) + '\n';
    
    await fs.promises.writeFile(change.sourcePath, formatted, 'utf8');
  }

  /**
   * Create a backup of a file
   */
  private async createBackup(change: Change): Promise<string> {
    const sourceFile = change.sourcePath!;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${path.basename(sourceFile)}.${timestamp}.backup`;
    const backupPath = path.join(this.backupDir, backupFileName);

    // Read original content for backup
    const originalContent = await fs.promises.readFile(sourceFile, 'utf8');
    await fs.promises.writeFile(backupPath, originalContent, 'utf8');

    // Record backup info
    const backupInfo: BackupInfo = {
      originalPath: sourceFile,
      backupPath,
      createdAt: new Date(),
      changeType: change.type,
      changeId: change.id
    };
    this.backups.push(backupInfo);

    return backupPath;
  }

  /**
   * Restore a file from backup
   */
  private async restoreFromBackup(backupPath: string, originalPath: string): Promise<void> {
    const backupContent = await fs.promises.readFile(backupPath, 'utf8');
    await fs.promises.writeFile(originalPath, backupContent, 'utf8');
  }

  /**
   * Rollback changes using the change log
   */
  async rollback(changeIds?: string[]): Promise<ExecutionResult> {
    const startTime = Date.now();
    const changesToRollback = changeIds 
      ? this.changeLog.filter(r => changeIds.includes(r.change.id))
      : [...this.changeLog].reverse(); // Rollback in reverse order

    const rollbackResults: ChangeResult[] = [];
    let successfulRollbacks = 0;
    let failedRollbacks = 0;

    for (const originalResult of changesToRollback) {
      if (!originalResult.success) {
        continue; // Skip changes that weren't successfully applied
      }

      try {
        await this.rollbackSingleChange(originalResult);
        rollbackResults.push({
          change: originalResult.change,
          success: true,
          executedAt: new Date()
        });
        successfulRollbacks++;
      } catch (error) {
        rollbackResults.push({
          change: originalResult.change,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown rollback error',
          executedAt: new Date()
        });
        failedRollbacks++;
      }
    }

    return {
      plan: { 
        changes: changesToRollback.map(r => r.change),
        estimatedTime: 0,
        affectedFiles: 0,
        riskBreakdown: { safe: 0, review: 0, manual: 0 }
      },
      changeResults: rollbackResults,
      backups: [],
      success: failedRollbacks === 0,
      executionTime: Date.now() - startTime,
      summary: {
        totalChanges: changesToRollback.length,
        successfulChanges: successfulRollbacks,
        failedChanges: failedRollbacks,
        filesModified: successfulRollbacks,
        backupsCreated: 0
      }
    };
  }

  /**
   * Rollback a single change
   */
  private async rollbackSingleChange(result: ChangeResult): Promise<void> {
    const change = result.change;

    switch (change.type) {
      case 'delete_file':
        // Restore from backup if available
        if (result.backupPath) {
          await this.restoreFromBackup(result.backupPath, change.sourcePath!);
        } else {
          throw new Error('Cannot rollback file deletion without backup');
        }
        break;

      case 'move_file':
        // Move file back to original location
        if (await this.fileExists(change.targetPath!)) {
          await fs.promises.rename(change.targetPath!, change.sourcePath!);
        }
        break;

      case 'modify_file':
      case 'update_package_json':
        // Restore from backup
        if (result.backupPath) {
          await this.restoreFromBackup(result.backupPath, change.sourcePath!);
        } else if (change.originalContent !== undefined) {
          await fs.promises.writeFile(change.sourcePath!, change.originalContent, 'utf8');
        } else {
          throw new Error('Cannot rollback file modification without backup or original content');
        }
        break;

      case 'create_file':
        // Delete the created file
        if (await this.fileExists(change.targetPath!)) {
          await fs.promises.unlink(change.targetPath!);
        }
        break;
    }
  }

  /**
   * Get the current change log
   */
  getChangeLog(): ChangeResult[] {
    return [...this.changeLog];
  }

  /**
   * Get the list of backups created
   */
  getBackups(): BackupInfo[] {
    return [...this.backups];
  }

  /**
   * Clean up old backups
   */
  async cleanupBackups(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let cleanedCount = 0;
    
    try {
      const backupFiles = await fs.promises.readdir(this.backupDir);
      
      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.promises.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.promises.unlink(filePath);
          cleanedCount++;
        }
      }
    } catch (error) {
      // Backup directory might not exist, which is fine
    }

    return cleanedCount;
  }

  /**
   * Helper methods
   */
  private async ensureBackupDirectory(): Promise<void> {
    await fs.promises.mkdir(this.backupDir, { recursive: true });
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private needsBackup(change: Change): boolean {
    return change.type === 'delete_file' || 
           change.type === 'modify_file' || 
           change.type === 'update_package_json';
  }

  private shouldExecuteChange(change: Change, options: ExecutionOptions): boolean {
    const riskLevels: RiskLevel[] = ['safe', 'review', 'manual'];
    const changeRiskIndex = riskLevels.indexOf(change.riskLevel);
    const maxRiskIndex = riskLevels.indexOf(options.maxAutoRiskLevel);
    
    return changeRiskIndex <= maxRiskIndex;
  }

  /**
   * Get the safety manager instance
   */
  getSafetyManager(): SafetyManager {
    return this.safetyManager;
  }

  /**
   * Update safety configuration
   */
  updateSafetyConfig(config: Partial<SafetyConfig>): void {
    this.safetyManager.updateConfig(config);
  }

  /**
   * Check if a change is safe to execute
   */
  async checkChangeSafety(change: Change) {
    return await this.safetyManager.checkChangeSafety(change);
  }

  /**
   * Get safety recommendations for a change
   */
  getSafetyRecommendations(change: Change): string[] {
    return this.safetyManager.getSafetyRecommendations(change);
  }
}