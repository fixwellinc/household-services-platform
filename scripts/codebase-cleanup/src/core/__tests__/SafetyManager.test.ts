import { SafetyManager, SafetyConfig } from '../SafetyManager';
import { Change, RiskLevel } from '../../types';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    stat: jest.fn()
  }
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('SafetyManager', () => {
  let safetyManager: SafetyManager;
  let mockChange: Change;

  beforeEach(() => {
    safetyManager = new SafetyManager();
    mockChange = {
      id: 'test-change-1',
      type: 'delete_file',
      description: 'Test change',
      sourcePath: 'test/file.js',
      riskLevel: 'safe',
      autoApplicable: true
    };
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const config = safetyManager.getConfig();
      expect(config.criticalFiles).toContain('package.json');
      expect(config.criticalFiles).toContain('tsconfig.json');
      expect(config.requireConfirmation).toBe(true);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<SafetyConfig> = {
        requireConfirmation: false,
        maxAutoDeleteSize: 500000
      };
      const customSafetyManager = new SafetyManager(customConfig);
      const config = customSafetyManager.getConfig();
      
      expect(config.requireConfirmation).toBe(false);
      expect(config.maxAutoDeleteSize).toBe(500000);
    });
  });

  describe('checkChangeSafety', () => {
    it('should reject changes with no file path', async () => {
      const changeWithoutPath: Change = {
        ...mockChange,
        sourcePath: undefined,
        targetPath: undefined
      };

      const result = await safetyManager.checkChangeSafety(changeWithoutPath);
      
      expect(result.safe).toBe(false);
      expect(result.riskLevel).toBe('manual');
      expect(result.reason).toContain('no file path specified');
    });

    it('should reject blacklisted files', async () => {
      safetyManager.addToBlacklist(['test/**']);
      
      const result = await safetyManager.checkChangeSafety(mockChange);
      
      expect(result.safe).toBe(false);
      expect(result.riskLevel).toBe('manual');
      expect(result.reason).toContain('blacklisted');
    });

    it('should allow whitelisted files', async () => {
      safetyManager.addToWhitelist(['test/**']);
      
      const result = await safetyManager.checkChangeSafety(mockChange);
      
      expect(result.safe).toBe(true);
      expect(result.riskLevel).toBe('safe');
      expect(result.reason).toContain('whitelisted');
    });

    it('should identify critical files', async () => {
      const criticalChange: Change = {
        ...mockChange,
        sourcePath: 'package.json'
      };

      const result = await safetyManager.checkChangeSafety(criticalChange);
      
      expect(result.safe).toBe(false);
      expect(result.riskLevel).toBe('manual');
      expect(result.reason).toContain('critical file');
    });

    it('should allow safe patterns', async () => {
      const safeChange: Change = {
        ...mockChange,
        sourcePath: 'temp/cache.log'
      };

      const result = await safetyManager.checkChangeSafety(safeChange);
      
      expect(result.safe).toBe(true);
      expect(result.riskLevel).toBe('safe');
      expect(result.reason).toContain('safe pattern');
    });

    it('should flag dangerous patterns', async () => {
      const dangerousChange: Change = {
        ...mockChange,
        sourcePath: 'src/tsconfig.json'
      };

      const result = await safetyManager.checkChangeSafety(dangerousChange);
      
      expect(result.safe).toBe(false);
      expect(result.riskLevel).toBe('review');
      expect(result.reason).toContain('dangerous pattern');
    });

    it('should check file size for delete operations', async () => {
      const largeFileStats = { size: 2 * 1024 * 1024 }; // 2MB
      mockFs.promises.stat = jest.fn().mockResolvedValue(largeFileStats);

      const result = await safetyManager.checkChangeSafety(mockChange);
      
      expect(result.safe).toBe(false);
      expect(result.riskLevel).toBe('review');
      expect(result.reason).toContain('large');
    });

    it('should handle file stat errors gracefully', async () => {
      mockFs.promises.stat = jest.fn().mockRejectedValue(new Error('File not found'));

      const result = await safetyManager.checkChangeSafety(mockChange);
      
      expect(result.safe).toBe(false);
      expect(result.riskLevel).toBe('manual');
      expect(result.reason).toContain('Cannot access file');
    });
  });

  describe('checkBatchSafety', () => {
    it('should identify unsafe changes in batch', async () => {
      const changes: Change[] = [
        mockChange,
        {
          ...mockChange,
          id: 'test-change-2',
          sourcePath: 'package.json'
        }
      ];

      const result = await safetyManager.checkBatchSafety(changes);
      
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('unsafe changes detected');
    });

    it('should identify high-risk changes in batch', async () => {
      const changes: Change[] = [
        {
          ...mockChange,
          sourcePath: 'safe/file.log'
        },
        {
          ...mockChange,
          id: 'test-change-2',
          sourcePath: 'config/tsconfig.json'
        }
      ];

      const result = await safetyManager.checkBatchSafety(changes);
      
      expect(result.safe).toBe(true);
      expect(result.riskLevel).toBe('review');
      expect(result.reason).toContain('require review');
    });

    it('should pass safe batch operations', async () => {
      safetyManager.addToWhitelist(['test/**']);
      const changes: Change[] = [
        mockChange,
        {
          ...mockChange,
          id: 'test-change-2',
          sourcePath: 'test/another.js'
        }
      ];

      const result = await safetyManager.checkBatchSafety(changes);
      
      expect(result.safe).toBe(true);
      expect(result.riskLevel).toBe('safe');
    });
  });

  describe('getSafetyRecommendations', () => {
    it('should provide recommendations for critical files', () => {
      const criticalChange: Change = {
        ...mockChange,
        sourcePath: 'package.json'
      };

      const recommendations = safetyManager.getSafetyRecommendations(criticalChange);
      
      expect(recommendations).toContain('Create a backup before modifying critical files');
      expect(recommendations).toContain('Test the change in a development environment first');
    });

    it('should provide recommendations for delete operations', () => {
      const recommendations = safetyManager.getSafetyRecommendations(mockChange);
      
      expect(recommendations).toContain('Verify the file is not referenced elsewhere in the codebase');
      expect(recommendations).toContain('Check if the file is imported by other modules');
    });

    it('should provide recommendations for move operations', () => {
      const moveChange: Change = {
        ...mockChange,
        type: 'move_file',
        targetPath: 'new/location.js'
      };

      const recommendations = safetyManager.getSafetyRecommendations(moveChange);
      
      expect(recommendations).toContain('Update all import statements that reference the moved file');
      expect(recommendations).toContain('Check for hardcoded file paths in configuration files');
    });

    it('should provide recommendations for package.json updates', () => {
      const packageChange: Change = {
        ...mockChange,
        type: 'update_package_json'
      };

      const recommendations = safetyManager.getSafetyRecommendations(packageChange);
      
      expect(recommendations).toContain('Run npm/yarn install after updating package.json');
      expect(recommendations).toContain('Verify all dependencies are still compatible');
    });
  });

  describe('whitelist/blacklist management', () => {
    it('should add patterns to whitelist', () => {
      const patterns = ['src/**', 'lib/**'];
      safetyManager.addToWhitelist(patterns);
      
      const config = safetyManager.getConfig();
      expect(config.whitelist).toContain('src/**');
      expect(config.whitelist).toContain('lib/**');
    });

    it('should add patterns to blacklist', () => {
      const patterns = ['temp/**', '*.tmp'];
      safetyManager.addToBlacklist(patterns);
      
      const config = safetyManager.getConfig();
      expect(config.blacklist).toContain('temp/**');
      expect(config.blacklist).toContain('*.tmp');
    });

    it('should remove patterns from whitelist', () => {
      safetyManager.addToWhitelist(['src/**', 'lib/**']);
      safetyManager.removeFromWhitelist(['src/**']);
      
      const config = safetyManager.getConfig();
      expect(config.whitelist).not.toContain('src/**');
      expect(config.whitelist).toContain('lib/**');
    });

    it('should remove patterns from blacklist', () => {
      safetyManager.addToBlacklist(['temp/**', '*.tmp']);
      safetyManager.removeFromBlacklist(['temp/**']);
      
      const config = safetyManager.getConfig();
      expect(config.blacklist).not.toContain('temp/**');
      expect(config.blacklist).toContain('*.tmp');
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      const newConfig: Partial<SafetyConfig> = {
        requireConfirmation: false,
        maxAutoDeleteSize: 500000
      };

      safetyManager.updateConfig(newConfig);
      const config = safetyManager.getConfig();
      
      expect(config.requireConfirmation).toBe(false);
      expect(config.maxAutoDeleteSize).toBe(500000);
    });

    it('should return a copy of configuration', () => {
      const config1 = safetyManager.getConfig();
      const config2 = safetyManager.getConfig();
      
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different objects
    });
  });

  describe('critical file assessment', () => {
    it('should prevent deletion of critical files', async () => {
      const criticalChange: Change = {
        ...mockChange,
        type: 'delete_file',
        sourcePath: 'package.json'
      };

      const result = await safetyManager.checkChangeSafety(criticalChange);
      
      expect(result.safe).toBe(false);
      expect(result.riskLevel).toBe('manual');
      expect(result.suggestion).toContain('should not be deleted');
    });

    it('should allow modification of critical files with review', async () => {
      const criticalChange: Change = {
        ...mockChange,
        type: 'modify_file',
        sourcePath: 'tsconfig.json'
      };

      const result = await safetyManager.checkChangeSafety(criticalChange);
      
      expect(result.safe).toBe(true);
      expect(result.riskLevel).toBe('review');
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should prevent moving critical files', async () => {
      const criticalChange: Change = {
        ...mockChange,
        type: 'move_file',
        sourcePath: 'package.json',
        targetPath: 'new/package.json'
      };

      const result = await safetyManager.checkChangeSafety(criticalChange);
      
      expect(result.safe).toBe(false);
      expect(result.riskLevel).toBe('manual');
      expect(result.suggestion).toContain('Moving critical files can break the build');
    });
  });

  describe('edge cases', () => {
    it('should handle glob patterns correctly', async () => {
      safetyManager.addToWhitelist(['**/*.test.js']);
      
      const testChange: Change = {
        ...mockChange,
        sourcePath: 'src/components/Button.test.js'
      };

      const result = await safetyManager.checkChangeSafety(testChange);
      
      expect(result.safe).toBe(true);
      expect(result.riskLevel).toBe('safe');
    });

    it('should handle changes with only target path', async () => {
      const createChange: Change = {
        ...mockChange,
        type: 'create_file',
        sourcePath: undefined,
        targetPath: 'new/file.js'
      };

      const result = await safetyManager.checkChangeSafety(createChange);
      
      expect(result.safe).toBe(true);
      expect(result.riskLevel).toBe('safe');
    });

    it('should handle unknown change types', async () => {
      const unknownChange: Change = {
        ...mockChange,
        type: 'unknown_type' as any
      };

      const result = await safetyManager.checkChangeSafety(unknownChange);
      
      expect(result.safe).toBe(false);
      expect(result.riskLevel).toBe('manual');
      expect(result.reason).toContain('Unknown change type');
    });
  });
});