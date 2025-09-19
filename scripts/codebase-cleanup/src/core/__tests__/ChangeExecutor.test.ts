import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ChangeExecutor } from '../ChangeExecutor';
import { Change, ExecutionOptions, ChangeType, RiskLevel } from '../../types';

describe('ChangeExecutor', () => {
  let tempDir: string;
  let executor: ChangeExecutor;
  let backupDir: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'change-executor-test-'));
    backupDir = path.join(tempDir, '.backups');
    executor = new ChangeExecutor(backupDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });

  describe('createExecutionPlan', () => {
    it('should create a valid execution plan', async () => {
      const changes: Change[] = [
        createMockChange('1', 'delete_file', 'safe', { sourcePath: 'file1.txt' }),
        createMockChange('2', 'modify_file', 'review', { sourcePath: 'file2.txt' }),
        createMockChange('3', 'create_file', 'manual', { targetPath: 'file3.txt' })
      ];

      const plan = await executor.createExecutionPlan(changes);

      expect(plan.changes).toHaveLength(3);
      expect(plan.affectedFiles).toBe(3);
      expect(plan.riskBreakdown).toEqual({
        safe: 1,
        review: 1,
        manual: 1
      });
      expect(plan.estimatedTime).toBe(300); // 3 changes * 100ms
    });

    it('should count unique affected files correctly', async () => {
      const changes: Change[] = [
        createMockChange('1', 'modify_file', 'safe', { sourcePath: 'file1.txt' }),
        createMockChange('2', 'modify_file', 'safe', { sourcePath: 'file1.txt' }), // Same file
        createMockChange('3', 'move_file', 'safe', { sourcePath: 'file2.txt', targetPath: 'file3.txt' })
      ];

      const plan = await executor.createExecutionPlan(changes);

      expect(plan.affectedFiles).toBe(3); // file1.txt, file2.txt, file3.txt
    });
  });

  describe('executePlan - dry run mode', () => {
    it('should execute plan in dry-run mode without making changes', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.promises.writeFile(testFile, 'original content');

      const changes: Change[] = [
        createMockChange('1', 'modify_file', 'safe', {
          sourcePath: testFile,
          content: 'new content'
        })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: true,
        createBackups: false,
        continueOnError: true,
        maxAutoRiskLevel: 'manual'
      };

      const result = await executor.executePlan(plan, options);

      expect(result.success).toBe(true);
      expect(result.summary.successfulChanges).toBe(1);
      expect(result.summary.backupsCreated).toBe(0);

      // File should remain unchanged
      const content = await fs.promises.readFile(testFile, 'utf8');
      expect(content).toBe('original content');
    });
  });

  describe('executePlan - actual execution', () => {
    it('should execute file deletion with backup', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.promises.writeFile(testFile, 'test content');

      const changes: Change[] = [
        createMockChange('1', 'delete_file', 'safe', {
          sourcePath: testFile
        })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: true,
        continueOnError: true,
        maxAutoRiskLevel: 'safe'
      };

      const result = await executor.executePlan(plan, options);

      expect(result.success).toBe(true);
      expect(result.summary.successfulChanges).toBe(1);
      expect(result.summary.backupsCreated).toBe(1);

      // File should be deleted
      expect(await fileExists(testFile)).toBe(false);

      // Backup should exist
      expect(result.backups).toHaveLength(1);
      const backupPath = result.backups[0].backupPath;
      expect(await fileExists(backupPath)).toBe(true);
      
      const backupContent = await fs.promises.readFile(backupPath, 'utf8');
      expect(backupContent).toBe('test content');
    });

    it('should execute file modification with backup', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.promises.writeFile(testFile, 'original content');

      const changes: Change[] = [
        createMockChange('1', 'modify_file', 'safe', {
          sourcePath: testFile,
          content: 'modified content'
        })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: true,
        continueOnError: true,
        maxAutoRiskLevel: 'safe'
      };

      const result = await executor.executePlan(plan, options);

      expect(result.success).toBe(true);
      expect(result.summary.successfulChanges).toBe(1);
      expect(result.summary.backupsCreated).toBe(1);

      // File should be modified
      const content = await fs.promises.readFile(testFile, 'utf8');
      expect(content).toBe('modified content');

      // Backup should contain original content
      const backupPath = result.backups[0].backupPath;
      const backupContent = await fs.promises.readFile(backupPath, 'utf8');
      expect(backupContent).toBe('original content');
    });

    it('should execute file move operation', async () => {
      const sourceFile = path.join(tempDir, 'source.txt');
      const targetFile = path.join(tempDir, 'subdir', 'target.txt');
      await fs.promises.writeFile(sourceFile, 'content to move');

      const changes: Change[] = [
        createMockChange('1', 'move_file', 'safe', {
          sourcePath: sourceFile,
          targetPath: targetFile
        })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: false,
        continueOnError: true,
        maxAutoRiskLevel: 'safe'
      };

      const result = await executor.executePlan(plan, options);

      expect(result.success).toBe(true);
      expect(result.summary.successfulChanges).toBe(1);

      // Source file should not exist
      expect(await fileExists(sourceFile)).toBe(false);

      // Target file should exist with correct content
      expect(await fileExists(targetFile)).toBe(true);
      const content = await fs.promises.readFile(targetFile, 'utf8');
      expect(content).toBe('content to move');
    });

    it('should execute file creation', async () => {
      const targetFile = path.join(tempDir, 'subdir', 'new.txt');

      const changes: Change[] = [
        createMockChange('1', 'create_file', 'safe', {
          targetPath: targetFile,
          content: 'new file content'
        })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: false,
        continueOnError: true,
        maxAutoRiskLevel: 'safe'
      };

      const result = await executor.executePlan(plan, options);

      expect(result.success).toBe(true);
      expect(result.summary.successfulChanges).toBe(1);

      // File should be created with correct content
      expect(await fileExists(targetFile)).toBe(true);
      const content = await fs.promises.readFile(targetFile, 'utf8');
      expect(content).toBe('new file content');
    });

    it('should execute package.json update with proper formatting', async () => {
      const packageFile = path.join(tempDir, 'package.json');
      const originalPackage = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          'old-dep': '^1.0.0'
        }
      };
      await fs.promises.writeFile(packageFile, JSON.stringify(originalPackage, null, 2));

      const updatedPackage = {
        name: 'test-package',
        version: '1.0.0',
        dependencies: {}
      };

      const changes: Change[] = [
        createMockChange('1', 'update_package_json', 'safe', {
          sourcePath: packageFile,
          content: JSON.stringify(updatedPackage)
        })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: true,
        continueOnError: true,
        maxAutoRiskLevel: 'safe'
      };

      const result = await executor.executePlan(plan, options);

      expect(result.success).toBe(true);
      expect(result.summary.successfulChanges).toBe(1);

      // File should be updated with proper formatting
      const content = await fs.promises.readFile(packageFile, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(updatedPackage);
      expect(content.endsWith('\n')).toBe(true); // Should end with newline
    });
  });

  describe('risk level filtering', () => {
    it('should skip changes that exceed maximum risk level', async () => {
      // Create actual files for the changes to be valid
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');
      const file3 = path.join(tempDir, 'file3.txt');
      
      await fs.promises.writeFile(file1, 'content1');
      await fs.promises.writeFile(file2, 'content2');
      await fs.promises.writeFile(file3, 'content3');

      const changes: Change[] = [
        createMockChange('1', 'delete_file', 'safe', { sourcePath: file1 }),
        createMockChange('2', 'delete_file', 'review', { sourcePath: file2 }),
        createMockChange('3', 'delete_file', 'manual', { sourcePath: file3 })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: true,
        createBackups: false,
        continueOnError: true,
        maxAutoRiskLevel: 'safe' // Only allow safe changes
      };

      const result = await executor.executePlan(plan, options);

      expect(result.summary.totalChanges).toBe(3);
      expect(result.summary.successfulChanges).toBe(1); // Only safe change
      expect(result.summary.failedChanges).toBe(2); // Review and manual skipped
      
      // Check that the skipped changes have the right error message
      const failedResults = result.changeResults.filter(r => !r.success);
      expect(failedResults).toHaveLength(2);
      expect(failedResults[0].error).toContain('Risk level');
      expect(failedResults[1].error).toContain('Risk level');
    });
  });

  describe('error handling', () => {
    it('should handle file not found errors gracefully', async () => {
      const nonExistentFile = path.join(tempDir, 'nonexistent.txt');

      const changes: Change[] = [
        createMockChange('1', 'delete_file', 'safe', {
          sourcePath: nonExistentFile
        })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: false,
        continueOnError: true,
        maxAutoRiskLevel: 'safe'
      };

      const result = await executor.executePlan(plan, options);

      expect(result.success).toBe(false);
      expect(result.summary.failedChanges).toBe(1);
      expect(result.changeResults[0].error).toMatch(/ENOENT|no such file or directory/i);
    });

    it('should stop execution on error when continueOnError is false', async () => {
      const nonExistentFile = path.join(tempDir, 'nonexistent.txt');
      const validFile = path.join(tempDir, 'valid.txt');
      await fs.promises.writeFile(validFile, 'content');

      const changes: Change[] = [
        createMockChange('1', 'delete_file', 'safe', {
          sourcePath: nonExistentFile
        }),
        createMockChange('2', 'delete_file', 'safe', {
          sourcePath: validFile
        })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: false,
        continueOnError: false, // Stop on first error
        maxAutoRiskLevel: 'safe'
      };

      const result = await executor.executePlan(plan, options);

      expect(result.success).toBe(false);
      expect(result.changeResults).toHaveLength(1); // Only first change attempted
      expect(result.summary.failedChanges).toBe(1);
      expect(result.summary.successfulChanges).toBe(0);

      // Second file should still exist
      expect(await fileExists(validFile)).toBe(true);
    });

    it('should restore backup on change failure', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.promises.writeFile(testFile, 'original content');

      // Create a change that will fail (invalid JSON for package.json)
      const changes: Change[] = [
        createMockChange('1', 'update_package_json', 'safe', {
          sourcePath: testFile,
          content: 'invalid json content'
        })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: true,
        continueOnError: true,
        maxAutoRiskLevel: 'safe'
      };

      const result = await executor.executePlan(plan, options);

      expect(result.success).toBe(false);
      expect(result.summary.failedChanges).toBe(1);

      // Original file should still exist with original content
      expect(await fileExists(testFile)).toBe(true);
      const content = await fs.promises.readFile(testFile, 'utf8');
      expect(content).toBe('original content');
    });
  });

  describe('rollback functionality', () => {
    it('should rollback file deletion', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.promises.writeFile(testFile, 'test content');

      // Execute deletion
      const changes: Change[] = [
        createMockChange('1', 'delete_file', 'safe', {
          sourcePath: testFile
        })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: true,
        continueOnError: true,
        maxAutoRiskLevel: 'safe'
      };

      const executeResult = await executor.executePlan(plan, options);
      expect(executeResult.success).toBe(true);
      expect(await fileExists(testFile)).toBe(false);

      // Rollback
      const rollbackResult = await executor.rollback();
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.summary.successfulChanges).toBe(1);

      // File should be restored
      expect(await fileExists(testFile)).toBe(true);
      const content = await fs.promises.readFile(testFile, 'utf8');
      expect(content).toBe('test content');
    });

    it('should rollback file modification', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.promises.writeFile(testFile, 'original content');

      // Execute modification
      const changes: Change[] = [
        createMockChange('1', 'modify_file', 'safe', {
          sourcePath: testFile,
          content: 'modified content'
        })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: true,
        continueOnError: true,
        maxAutoRiskLevel: 'safe'
      };

      const executeResult = await executor.executePlan(plan, options);
      expect(executeResult.success).toBe(true);

      let content = await fs.promises.readFile(testFile, 'utf8');
      expect(content).toBe('modified content');

      // Rollback
      const rollbackResult = await executor.rollback();
      expect(rollbackResult.success).toBe(true);

      // File should be restored to original content
      content = await fs.promises.readFile(testFile, 'utf8');
      expect(content).toBe('original content');
    });

    it('should rollback file move', async () => {
      const sourceFile = path.join(tempDir, 'source.txt');
      const targetFile = path.join(tempDir, 'target.txt');
      await fs.promises.writeFile(sourceFile, 'content to move');

      // Execute move
      const changes: Change[] = [
        createMockChange('1', 'move_file', 'safe', {
          sourcePath: sourceFile,
          targetPath: targetFile
        })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: false,
        continueOnError: true,
        maxAutoRiskLevel: 'safe'
      };

      const executeResult = await executor.executePlan(plan, options);
      expect(executeResult.success).toBe(true);
      expect(await fileExists(sourceFile)).toBe(false);
      expect(await fileExists(targetFile)).toBe(true);

      // Rollback
      const rollbackResult = await executor.rollback();
      expect(rollbackResult.success).toBe(true);

      // File should be moved back
      expect(await fileExists(sourceFile)).toBe(true);
      expect(await fileExists(targetFile)).toBe(false);
      const content = await fs.promises.readFile(sourceFile, 'utf8');
      expect(content).toBe('content to move');
    });

    it('should rollback file creation', async () => {
      const targetFile = path.join(tempDir, 'new.txt');

      // Execute creation
      const changes: Change[] = [
        createMockChange('1', 'create_file', 'safe', {
          targetPath: targetFile,
          content: 'new content'
        })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: false,
        continueOnError: true,
        maxAutoRiskLevel: 'safe'
      };

      const executeResult = await executor.executePlan(plan, options);
      expect(executeResult.success).toBe(true);
      expect(await fileExists(targetFile)).toBe(true);

      // Rollback
      const rollbackResult = await executor.rollback();
      expect(rollbackResult.success).toBe(true);

      // File should be deleted
      expect(await fileExists(targetFile)).toBe(false);
    });

    it('should rollback specific changes by ID', async () => {
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');
      await fs.promises.writeFile(file1, 'content1');
      await fs.promises.writeFile(file2, 'content2');

      // Execute multiple changes
      const changes: Change[] = [
        createMockChange('change1', 'modify_file', 'safe', {
          sourcePath: file1,
          content: 'modified1'
        }),
        createMockChange('change2', 'modify_file', 'safe', {
          sourcePath: file2,
          content: 'modified2'
        })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: true,
        continueOnError: true,
        maxAutoRiskLevel: 'safe'
      };

      const executeResult = await executor.executePlan(plan, options);
      expect(executeResult.success).toBe(true);

      // Rollback only the first change
      const rollbackResult = await executor.rollback(['change1']);
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.summary.successfulChanges).toBe(1);

      // First file should be restored, second should remain modified
      let content1 = await fs.promises.readFile(file1, 'utf8');
      let content2 = await fs.promises.readFile(file2, 'utf8');
      expect(content1).toBe('content1');
      expect(content2).toBe('modified2');
    });
  });

  describe('progress reporting', () => {
    it('should report progress during execution', async () => {
      const progressUpdates: any[] = [];
      
      const changes: Change[] = [
        createMockChange('1', 'create_file', 'safe', {
          targetPath: path.join(tempDir, 'file1.txt'),
          content: 'content1'
        }),
        createMockChange('2', 'create_file', 'safe', {
          targetPath: path.join(tempDir, 'file2.txt'),
          content: 'content2'
        })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: false,
        continueOnError: true,
        maxAutoRiskLevel: 'safe',
        progressCallback: (progress) => {
          progressUpdates.push(progress);
        }
      };

      const result = await executor.executePlan(plan, options);

      expect(result.success).toBe(true);
      expect(progressUpdates).toHaveLength(2);
      expect(progressUpdates[0].completedSteps).toBe(0);
      expect(progressUpdates[0].totalSteps).toBe(2);
      expect(progressUpdates[1].completedSteps).toBe(1);
      expect(progressUpdates[1].totalSteps).toBe(2);
    });
  });

  describe('confirmation callback', () => {
    it('should ask for confirmation when callback is provided', async () => {
      const confirmations: Change[] = [];
      let shouldConfirm = true;

      const testFile = path.join(tempDir, 'test.txt');
      await fs.promises.writeFile(testFile, 'content');

      const changes: Change[] = [
        createMockChange('1', 'delete_file', 'safe', {
          sourcePath: testFile
        })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: false,
        continueOnError: true,
        maxAutoRiskLevel: 'safe',
        confirmCallback: async (change) => {
          confirmations.push(change);
          return shouldConfirm;
        }
      };

      const result = await executor.executePlan(plan, options);

      expect(result.success).toBe(true);
      expect(confirmations).toHaveLength(1);
      expect(confirmations[0].id).toBe('1');
      expect(await fileExists(testFile)).toBe(false);
    });

    it('should skip changes when user declines confirmation', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.promises.writeFile(testFile, 'content');

      const changes: Change[] = [
        createMockChange('1', 'delete_file', 'safe', {
          sourcePath: testFile
        })
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: false,
        continueOnError: true,
        maxAutoRiskLevel: 'safe',
        confirmCallback: async () => false // Always decline
      };

      const result = await executor.executePlan(plan, options);

      expect(result.success).toBe(false);
      expect(result.summary.failedChanges).toBe(1);
      expect(result.changeResults[0].error).toContain('User declined');
      expect(await fileExists(testFile)).toBe(true); // File should still exist
    });
  });

  describe('backup cleanup', () => {
    it('should clean up old backups', async () => {
      // Create some old backup files
      await fs.promises.mkdir(backupDir, { recursive: true });
      
      const oldBackup = path.join(backupDir, 'old.backup');
      const recentBackup = path.join(backupDir, 'recent.backup');
      
      await fs.promises.writeFile(oldBackup, 'old content');
      await fs.promises.writeFile(recentBackup, 'recent content');
      
      // Make the old backup appear old by modifying its timestamp
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 days ago
      await fs.promises.utimes(oldBackup, oldDate, oldDate);

      const cleanedCount = await executor.cleanupBackups(30);

      expect(cleanedCount).toBe(1);
      expect(await fileExists(oldBackup)).toBe(false);
      expect(await fileExists(recentBackup)).toBe(true);
    });
  });
});

// Helper functions
function createMockChange(
  id: string, 
  type: ChangeType, 
  riskLevel: RiskLevel, 
  options: Partial<Change> = {}
): Change {
  return {
    id,
    type,
    riskLevel,
    description: `Mock ${type} change`,
    autoApplicable: true,
    ...options
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}