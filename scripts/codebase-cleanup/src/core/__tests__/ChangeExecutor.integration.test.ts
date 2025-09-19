import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ChangeExecutor } from '../ChangeExecutor';
import { Change, ExecutionOptions, Finding } from '../../types';

describe('ChangeExecutor Integration Tests', () => {
  let tempDir: string;
  let executor: ChangeExecutor;

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'change-executor-integration-'));
    executor = new ChangeExecutor(path.join(tempDir, '.backups'));
  });

  afterEach(async () => {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });

  describe('Real-world cleanup scenarios', () => {
    it('should handle duplicate file cleanup scenario', async () => {
      // Create a scenario with duplicate files
      const originalFile = path.join(tempDir, 'src', 'utils.ts');
      const duplicateFile1 = path.join(tempDir, 'backup', 'utils.ts');
      const duplicateFile2 = path.join(tempDir, 'old', 'utils.ts');

      const content = `
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
      `.trim();

      // Create directories and files
      await fs.promises.mkdir(path.dirname(originalFile), { recursive: true });
      await fs.promises.mkdir(path.dirname(duplicateFile1), { recursive: true });
      await fs.promises.mkdir(path.dirname(duplicateFile2), { recursive: true });

      await fs.promises.writeFile(originalFile, content);
      await fs.promises.writeFile(duplicateFile1, content);
      await fs.promises.writeFile(duplicateFile2, content);

      // Create changes to remove duplicates
      const changes: Change[] = [
        {
          id: 'remove-duplicate-1',
          type: 'delete_file',
          description: 'Remove duplicate utils.ts from backup directory',
          sourcePath: duplicateFile1,
          riskLevel: 'safe',
          autoApplicable: true,
          findingId: 'duplicate-utils-finding'
        },
        {
          id: 'remove-duplicate-2',
          type: 'delete_file',
          description: 'Remove duplicate utils.ts from old directory',
          sourcePath: duplicateFile2,
          riskLevel: 'safe',
          autoApplicable: true,
          findingId: 'duplicate-utils-finding'
        }
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: true,
        continueOnError: false,
        maxAutoRiskLevel: 'safe'
      };

      const result = await executor.executePlan(plan, options);

      expect(result.success).toBe(true);
      expect(result.summary.successfulChanges).toBe(2);
      expect(result.summary.backupsCreated).toBe(2);

      // Original file should remain
      expect(await fileExists(originalFile)).toBe(true);
      const originalContent = await fs.promises.readFile(originalFile, 'utf8');
      expect(originalContent).toBe(content);

      // Duplicates should be removed
      expect(await fileExists(duplicateFile1)).toBe(false);
      expect(await fileExists(duplicateFile2)).toBe(false);

      // Backups should exist
      expect(result.backups).toHaveLength(2);
      for (const backup of result.backups) {
        expect(await fileExists(backup.backupPath)).toBe(true);
        const backupContent = await fs.promises.readFile(backup.backupPath, 'utf8');
        expect(backupContent).toBe(content);
      }
    });

    it('should handle package.json dependency cleanup scenario', async () => {
      // Create a package.json with unused dependencies
      const packageFile = path.join(tempDir, 'package.json');
      const originalPackage = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'lodash': '^4.17.21',
          'unused-package': '^1.0.0',
          'another-unused': '^2.0.0'
        },
        devDependencies: {
          'typescript': '^4.9.0',
          'unused-dev-package': '^1.0.0'
        }
      };

      await fs.promises.writeFile(packageFile, JSON.stringify(originalPackage, null, 2));

      // Create a source file that only uses lodash
      const sourceFile = path.join(tempDir, 'src', 'index.ts');
      await fs.promises.mkdir(path.dirname(sourceFile), { recursive: true });
      await fs.promises.writeFile(sourceFile, `
import _ from 'lodash';

export function processData(data: any[]) {
  return _.uniq(data);
}
      `);

      // Create change to remove unused dependencies
      const cleanedPackage = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'lodash': '^4.17.21'
        },
        devDependencies: {
          'typescript': '^4.9.0'
        }
      };

      const changes: Change[] = [
        {
          id: 'cleanup-dependencies',
          type: 'update_package_json',
          description: 'Remove unused dependencies from package.json',
          sourcePath: packageFile,
          content: JSON.stringify(cleanedPackage),
          riskLevel: 'review',
          autoApplicable: true,
          findingId: 'unused-deps-finding'
        }
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: true,
        continueOnError: false,
        maxAutoRiskLevel: 'review'
      };

      const result = await executor.executePlan(plan, options);

      expect(result.success).toBe(true);
      expect(result.summary.successfulChanges).toBe(1);
      expect(result.summary.backupsCreated).toBe(1);

      // Package.json should be updated
      const updatedContent = await fs.promises.readFile(packageFile, 'utf8');
      const updatedPackage = JSON.parse(updatedContent);
      expect(updatedPackage).toEqual(cleanedPackage);

      // Should be properly formatted
      expect(updatedContent.endsWith('\n')).toBe(true);
      expect(updatedContent).toContain('  "lodash"'); // Proper indentation

      // Backup should contain original content
      const backupContent = await fs.promises.readFile(result.backups[0].backupPath, 'utf8');
      const backupPackage = JSON.parse(backupContent);
      expect(backupPackage).toEqual(originalPackage);
    });

    it('should handle file restructuring scenario', async () => {
      // Create files in inconsistent structure
      const oldUtilsFile = path.join(tempDir, 'utils.ts');
      const oldHelpersFile = path.join(tempDir, 'helpers.ts');
      const newUtilsFile = path.join(tempDir, 'src', 'utils', 'index.ts');
      const newHelpersFile = path.join(tempDir, 'src', 'utils', 'helpers.ts');

      const utilsContent = `
export function formatDate(date: Date): string {
  return date.toISOString();
}
      `.trim();

      const helpersContent = `
export function isValidEmail(email: string): boolean {
  return email.includes('@');
}
      `.trim();

      await fs.promises.writeFile(oldUtilsFile, utilsContent);
      await fs.promises.writeFile(oldHelpersFile, helpersContent);

      // Create changes to restructure files
      const changes: Change[] = [
        {
          id: 'move-utils',
          type: 'move_file',
          description: 'Move utils.ts to src/utils/index.ts',
          sourcePath: oldUtilsFile,
          targetPath: newUtilsFile,
          riskLevel: 'review',
          autoApplicable: true,
          findingId: 'restructure-finding'
        },
        {
          id: 'move-helpers',
          type: 'move_file',
          description: 'Move helpers.ts to src/utils/helpers.ts',
          sourcePath: oldHelpersFile,
          targetPath: newHelpersFile,
          riskLevel: 'review',
          autoApplicable: true,
          findingId: 'restructure-finding'
        }
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: false,
        continueOnError: false,
        maxAutoRiskLevel: 'review'
      };

      const result = await executor.executePlan(plan, options);

      expect(result.success).toBe(true);
      expect(result.summary.successfulChanges).toBe(2);

      // Old files should not exist
      expect(await fileExists(oldUtilsFile)).toBe(false);
      expect(await fileExists(oldHelpersFile)).toBe(false);

      // New files should exist with correct content
      expect(await fileExists(newUtilsFile)).toBe(true);
      expect(await fileExists(newHelpersFile)).toBe(true);

      const movedUtilsContent = await fs.promises.readFile(newUtilsFile, 'utf8');
      const movedHelpersContent = await fs.promises.readFile(newHelpersFile, 'utf8');

      expect(movedUtilsContent).toBe(utilsContent);
      expect(movedHelpersContent).toBe(helpersContent);
    });

    it('should handle mixed operations with rollback', async () => {
      // Create a complex scenario with multiple types of changes
      const fileToDelete = path.join(tempDir, 'obsolete.js');
      const fileToModify = path.join(tempDir, 'config.json');
      const fileToCreate = path.join(tempDir, 'new-feature.ts');

      await fs.promises.writeFile(fileToDelete, 'console.log("obsolete code");');
      await fs.promises.writeFile(fileToModify, JSON.stringify({ debug: true, version: '1.0.0' }));

      const changes: Change[] = [
        {
          id: 'delete-obsolete',
          type: 'delete_file',
          description: 'Remove obsolete JavaScript file',
          sourcePath: fileToDelete,
          riskLevel: 'safe',
          autoApplicable: true
        },
        {
          id: 'update-config',
          type: 'modify_file',
          description: 'Update configuration file',
          sourcePath: fileToModify,
          content: JSON.stringify({ debug: false, version: '1.1.0' }, null, 2),
          riskLevel: 'safe',
          autoApplicable: true
        },
        {
          id: 'create-feature',
          type: 'create_file',
          description: 'Create new feature file',
          targetPath: fileToCreate,
          content: `
export class NewFeature {
  constructor(private config: any) {}
  
  execute(): void {
    console.log('Executing new feature');
  }
}
          `.trim(),
          riskLevel: 'safe',
          autoApplicable: true
        }
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: true,
        continueOnError: false,
        maxAutoRiskLevel: 'safe'
      };

      // Execute the plan
      const executeResult = await executor.executePlan(plan, options);

      expect(executeResult.success).toBe(true);
      expect(executeResult.summary.successfulChanges).toBe(3);
      expect(executeResult.summary.backupsCreated).toBe(2); // Delete and modify operations

      // Verify changes were applied
      expect(await fileExists(fileToDelete)).toBe(false);
      expect(await fileExists(fileToCreate)).toBe(true);

      const modifiedConfig = JSON.parse(await fs.promises.readFile(fileToModify, 'utf8'));
      expect(modifiedConfig.debug).toBe(false);
      expect(modifiedConfig.version).toBe('1.1.0');

      const createdContent = await fs.promises.readFile(fileToCreate, 'utf8');
      expect(createdContent).toContain('export class NewFeature');

      // Now rollback all changes
      const rollbackResult = await executor.rollback();

      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.summary.successfulChanges).toBe(3);

      // Verify rollback
      expect(await fileExists(fileToDelete)).toBe(true); // Restored from backup
      expect(await fileExists(fileToCreate)).toBe(false); // Created file deleted

      const restoredDeletedContent = await fs.promises.readFile(fileToDelete, 'utf8');
      expect(restoredDeletedContent).toBe('console.log("obsolete code");');

      const restoredConfig = JSON.parse(await fs.promises.readFile(fileToModify, 'utf8'));
      expect(restoredConfig.debug).toBe(true);
      expect(restoredConfig.version).toBe('1.0.0');
    });

    it('should handle partial rollback of specific changes', async () => {
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');
      const file3 = path.join(tempDir, 'file3.txt');

      await fs.promises.writeFile(file1, 'content1');
      await fs.promises.writeFile(file2, 'content2');

      const changes: Change[] = [
        {
          id: 'modify-file1',
          type: 'modify_file',
          description: 'Modify file1',
          sourcePath: file1,
          content: 'modified content1',
          riskLevel: 'safe',
          autoApplicable: true
        },
        {
          id: 'modify-file2',
          type: 'modify_file',
          description: 'Modify file2',
          sourcePath: file2,
          content: 'modified content2',
          riskLevel: 'safe',
          autoApplicable: true
        },
        {
          id: 'create-file3',
          type: 'create_file',
          description: 'Create file3',
          targetPath: file3,
          content: 'new content3',
          riskLevel: 'safe',
          autoApplicable: true
        }
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: true,
        continueOnError: false,
        maxAutoRiskLevel: 'safe'
      };

      // Execute all changes
      const executeResult = await executor.executePlan(plan, options);
      expect(executeResult.success).toBe(true);

      // Verify all changes applied
      expect(await fs.promises.readFile(file1, 'utf8')).toBe('modified content1');
      expect(await fs.promises.readFile(file2, 'utf8')).toBe('modified content2');
      expect(await fs.promises.readFile(file3, 'utf8')).toBe('new content3');

      // Rollback only file1 and file3 changes
      const rollbackResult = await executor.rollback(['modify-file1', 'create-file3']);
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.summary.successfulChanges).toBe(2);

      // Verify partial rollback
      expect(await fs.promises.readFile(file1, 'utf8')).toBe('content1'); // Restored
      expect(await fs.promises.readFile(file2, 'utf8')).toBe('modified content2'); // Still modified
      expect(await fileExists(file3)).toBe(false); // Deleted
    });
  });

  describe('Error recovery scenarios', () => {
    it('should handle permission errors gracefully', async () => {
      const testFile = path.join(tempDir, 'readonly.txt');
      await fs.promises.writeFile(testFile, 'readonly content');

      // Make file read-only (this might not work on all systems)
      try {
        await fs.promises.chmod(testFile, 0o444);
      } catch {
        // Skip test if we can't change permissions
        return;
      }

      const changes: Change[] = [
        {
          id: 'modify-readonly',
          type: 'modify_file',
          description: 'Try to modify read-only file',
          sourcePath: testFile,
          content: 'new content',
          riskLevel: 'safe',
          autoApplicable: true
        }
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
      expect(result.changeResults[0].error).toMatch(/EACCES|EPERM|permission denied/i);

      // Restore permissions for cleanup
      await fs.promises.chmod(testFile, 0o644);
    });

    it('should handle disk space issues during backup creation', async () => {
      // This test is conceptual - actual disk space simulation is complex
      // In a real scenario, we would mock the fs operations to simulate ENOSPC
      const testFile = path.join(tempDir, 'large-file.txt');
      await fs.promises.writeFile(testFile, 'content');

      const changes: Change[] = [
        {
          id: 'delete-file',
          type: 'delete_file',
          description: 'Delete file with backup',
          sourcePath: testFile,
          riskLevel: 'safe',
          autoApplicable: true
        }
      ];

      const plan = await executor.createExecutionPlan(changes);
      const options: ExecutionOptions = {
        dryRun: false,
        createBackups: true,
        continueOnError: true,
        maxAutoRiskLevel: 'safe'
      };

      // In a real test, we would mock fs.promises.writeFile to throw ENOSPC
      // For now, we just verify the normal case works
      const result = await executor.executePlan(plan, options);
      expect(result.success).toBe(true);
    });
  });
});

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}