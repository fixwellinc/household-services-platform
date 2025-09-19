import { SafetyManager } from '../SafetyManager';
import { ChangeExecutor } from '../ChangeExecutor';
import { Change } from '../../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('SafetyManager Integration Tests', () => {
  let tempDir: string;
  let safetyManager: SafetyManager;
  let changeExecutor: ChangeExecutor;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'safety-test-'));
    safetyManager = new SafetyManager();
    changeExecutor = new ChangeExecutor(path.join(tempDir, '.backups'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });

  describe('Real file operations safety', () => {
    it('should prevent deletion of actual critical files', async () => {
      // Create a package.json file
      const packageJsonPath = path.join(tempDir, 'package.json');
      await fs.promises.writeFile(packageJsonPath, JSON.stringify({ name: 'test' }, null, 2));

      const deleteChange: Change = {
        id: 'delete-package-json',
        type: 'delete_file',
        description: 'Delete package.json',
        sourcePath: packageJsonPath,
        riskLevel: 'manual',
        autoApplicable: false
      };

      const result = await safetyManager.checkChangeSafety(deleteChange);
      
      expect(result.safe).toBe(false);
      expect(result.riskLevel).toBe('manual');
      expect(result.reason).toContain('critical file');
    });

    it('should allow deletion of safe files', async () => {
      // Create a log file
      const logFilePath = path.join(tempDir, 'debug.log');
      await fs.promises.writeFile(logFilePath, 'debug information');

      const deleteChange: Change = {
        id: 'delete-log',
        type: 'delete_file',
        description: 'Delete log file',
        sourcePath: logFilePath,
        riskLevel: 'safe',
        autoApplicable: true
      };

      const result = await safetyManager.checkChangeSafety(deleteChange);
      
      expect(result.safe).toBe(true);
      expect(result.riskLevel).toBe('safe');
    });

    it('should check actual file sizes', async () => {
      // Create a large file
      const largeFilePath = path.join(tempDir, 'large-file.txt');
      const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
      await fs.promises.writeFile(largeFilePath, largeContent);

      const deleteChange: Change = {
        id: 'delete-large-file',
        type: 'delete_file',
        description: 'Delete large file',
        sourcePath: largeFilePath,
        riskLevel: 'safe',
        autoApplicable: true
      };

      const result = await safetyManager.checkChangeSafety(deleteChange);
      
      expect(result.safe).toBe(false);
      expect(result.riskLevel).toBe('review');
      expect(result.reason).toContain('large');
    });

    it('should handle non-existent files gracefully', async () => {
      const nonExistentPath = path.join(tempDir, 'does-not-exist.txt');

      const deleteChange: Change = {
        id: 'delete-non-existent',
        type: 'delete_file',
        description: 'Delete non-existent file',
        sourcePath: nonExistentPath,
        riskLevel: 'safe',
        autoApplicable: true
      };

      const result = await safetyManager.checkChangeSafety(deleteChange);
      
      expect(result.safe).toBe(false);
      expect(result.riskLevel).toBe('manual');
      expect(result.reason).toContain('Cannot access file');
    });
  });

  describe('Integration with ChangeExecutor', () => {
    it('should prevent execution of unsafe changes', async () => {
      // Create a critical file
      const criticalFilePath = path.join(tempDir, 'package.json');
      await fs.promises.writeFile(criticalFilePath, JSON.stringify({ name: 'test' }));

      const unsafeChange: Change = {
        id: 'unsafe-change',
        type: 'delete_file',
        description: 'Delete critical file',
        sourcePath: criticalFilePath,
        riskLevel: 'manual',
        autoApplicable: false
      };

      const plan = await changeExecutor.createExecutionPlan([unsafeChange]);
      
      // This should throw due to batch safety check
      await expect(changeExecutor.executePlan(plan, {
        dryRun: false,
        createBackups: true,
        continueOnError: false,
        maxAutoRiskLevel: 'safe'
      })).rejects.toThrow('Batch safety check failed');
    });

    it('should allow execution of safe changes', async () => {
      // Create a safe file
      const safeFilePath = path.join(tempDir, 'temp.log');
      await fs.promises.writeFile(safeFilePath, 'temporary data');

      const safeChange: Change = {
        id: 'safe-change',
        type: 'delete_file',
        description: 'Delete temporary file',
        sourcePath: safeFilePath,
        riskLevel: 'safe',
        autoApplicable: true
      };

      const plan = await changeExecutor.createExecutionPlan([safeChange]);
      const result = await changeExecutor.executePlan(plan, {
        dryRun: false,
        createBackups: true,
        continueOnError: false,
        maxAutoRiskLevel: 'safe'
      });

      expect(result.success).toBe(true);
      expect(result.summary.successfulChanges).toBe(1);
      
      // Verify file was actually deleted
      expect(fs.existsSync(safeFilePath)).toBe(false);
    });

    it('should respect whitelist settings', async () => {
      // Create a file that would normally be considered risky
      const configFilePath = path.join(tempDir, 'webpack.config.js');
      await fs.promises.writeFile(configFilePath, 'module.exports = {};');

      // Add to whitelist
      const executor = new ChangeExecutor(path.join(tempDir, '.backups'), {
        whitelist: ['**/webpack.config.js']
      });

      const change: Change = {
        id: 'whitelisted-change',
        type: 'delete_file',
        description: 'Delete whitelisted config file',
        sourcePath: configFilePath,
        riskLevel: 'safe',
        autoApplicable: true
      };

      const plan = await executor.createExecutionPlan([change]);
      const result = await executor.executePlan(plan, {
        dryRun: false,
        createBackups: true,
        continueOnError: false,
        maxAutoRiskLevel: 'safe'
      });

      expect(result.success).toBe(true);
      expect(result.summary.successfulChanges).toBe(1);
    });

    it('should respect blacklist settings', async () => {
      // Create a normally safe file
      const logFilePath = path.join(tempDir, 'app.log');
      await fs.promises.writeFile(logFilePath, 'log data');

      // Add to blacklist
      const executor = new ChangeExecutor(path.join(tempDir, '.backups'), {
        blacklist: ['**/*.log']
      });

      const change: Change = {
        id: 'blacklisted-change',
        type: 'delete_file',
        description: 'Delete blacklisted log file',
        sourcePath: logFilePath,
        riskLevel: 'safe',
        autoApplicable: true
      };

      const plan = await executor.createExecutionPlan([change]);
      
      // Should fail due to blacklist
      await expect(executor.executePlan(plan, {
        dryRun: false,
        createBackups: true,
        continueOnError: false,
        maxAutoRiskLevel: 'safe'
      })).rejects.toThrow('Batch safety check failed');
    });
  });

  describe('Batch safety checks', () => {
    it('should handle mixed safety levels in batch', async () => {
      // Create multiple files with different safety levels
      const safeFile = path.join(tempDir, 'temp.log');
      const riskyFile = path.join(tempDir, 'tsconfig.json');
      const criticalFile = path.join(tempDir, 'package.json');

      await fs.promises.writeFile(safeFile, 'temp data');
      await fs.promises.writeFile(riskyFile, '{}');
      await fs.promises.writeFile(criticalFile, '{"name": "test"}');

      const changes: Change[] = [
        {
          id: 'safe-change',
          type: 'delete_file',
          description: 'Delete safe file',
          sourcePath: safeFile,
          riskLevel: 'safe',
          autoApplicable: true
        },
        {
          id: 'risky-change',
          type: 'modify_file',
          description: 'Modify risky file',
          sourcePath: riskyFile,
          content: '{"compilerOptions": {}}',
          riskLevel: 'review',
          autoApplicable: false
        },
        {
          id: 'critical-change',
          type: 'delete_file',
          description: 'Delete critical file',
          sourcePath: criticalFile,
          riskLevel: 'manual',
          autoApplicable: false
        }
      ];

      const batchResult = await safetyManager.checkBatchSafety(changes);
      
      expect(batchResult.safe).toBe(false);
      expect(batchResult.reason).toContain('unsafe changes detected');
    });

    it('should pass batch with only safe changes', async () => {
      // Create multiple safe files
      const files = ['temp1.log', 'temp2.cache', 'backup.bak'];
      const changes: Change[] = [];

      for (const fileName of files) {
        const filePath = path.join(tempDir, fileName);
        await fs.promises.writeFile(filePath, 'data');
        
        changes.push({
          id: `delete-${fileName}`,
          type: 'delete_file',
          description: `Delete ${fileName}`,
          sourcePath: filePath,
          riskLevel: 'safe',
          autoApplicable: true
        });
      }

      const batchResult = await safetyManager.checkBatchSafety(changes);
      
      expect(batchResult.safe).toBe(true);
      expect(batchResult.riskLevel).toBe('safe');
    });
  });

  describe('Safety recommendations', () => {
    it('should provide contextual recommendations', async () => {
      const packageJsonPath = path.join(tempDir, 'package.json');
      await fs.promises.writeFile(packageJsonPath, JSON.stringify({ name: 'test' }));

      const change: Change = {
        id: 'modify-package',
        type: 'update_package_json',
        description: 'Update package.json',
        sourcePath: packageJsonPath,
        content: JSON.stringify({ name: 'test', version: '1.0.0' }),
        riskLevel: 'review',
        autoApplicable: false
      };

      const recommendations = safetyManager.getSafetyRecommendations(change);
      
      expect(recommendations).toContain('Create a backup before modifying critical files');
      expect(recommendations).toContain('Run npm/yarn install after updating package.json');
      expect(recommendations).toContain('Verify all dependencies are still compatible');
    });
  });

  describe('Configuration persistence', () => {
    it('should maintain configuration across operations', async () => {
      // Add custom patterns
      safetyManager.addToWhitelist(['custom/**']);
      safetyManager.addToBlacklist(['forbidden/**']);

      // Create files matching patterns
      await fs.promises.mkdir(path.join(tempDir, 'custom'), { recursive: true });
      await fs.promises.mkdir(path.join(tempDir, 'forbidden'), { recursive: true });
      
      const whitelistedFile = path.join(tempDir, 'custom', 'file.js');
      const blacklistedFile = path.join(tempDir, 'forbidden', 'file.js');
      
      await fs.promises.writeFile(whitelistedFile, 'content');
      await fs.promises.writeFile(blacklistedFile, 'content');

      const whitelistedChange: Change = {
        id: 'whitelisted',
        type: 'delete_file',
        description: 'Delete whitelisted file',
        sourcePath: whitelistedFile,
        riskLevel: 'safe',
        autoApplicable: true
      };

      const blacklistedChange: Change = {
        id: 'blacklisted',
        type: 'delete_file',
        description: 'Delete blacklisted file',
        sourcePath: blacklistedFile,
        riskLevel: 'safe',
        autoApplicable: true
      };

      const whitelistedResult = await safetyManager.checkChangeSafety(whitelistedChange);
      const blacklistedResult = await safetyManager.checkChangeSafety(blacklistedChange);

      expect(whitelistedResult.safe).toBe(true);
      expect(whitelistedResult.reason).toContain('whitelisted');
      
      expect(blacklistedResult.safe).toBe(false);
      expect(blacklistedResult.reason).toContain('blacklisted');
    });
  });
});