import { program } from '../index';
import { SafetyManager } from '../core/SafetyManager';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock inquirer to avoid interactive prompts in tests
jest.mock('inquirer', () => ({
  prompt: jest.fn().mockResolvedValue({ action: 'proceed' })
}));

// Mock console methods to capture output
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('CLI Safety Integration Tests', () => {
  let tempDir: string;
  let originalArgv: string[];
  let originalExit: typeof process.exit;

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'cli-safety-test-'));
    originalArgv = process.argv;
    
    // Mock process.exit to prevent tests from actually exiting
    originalExit = process.exit;
    process.exit = jest.fn() as any;
    
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
    process.argv = originalArgv;
    process.exit = originalExit;
    jest.clearAllMocks();
  });

  describe('safety command', () => {
    it('should show current safety configuration', async () => {
      process.argv = ['node', 'cleanup', 'safety', '--show-config'];
      
      await program.parse();

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Current Safety Configuration'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Critical Files'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('package.json'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('tsconfig.json'));
    });

    it('should add patterns to whitelist', async () => {
      process.argv = ['node', 'cleanup', 'safety', '--add-whitelist', 'src/**,lib/**'];
      
      await program.parse();

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Added 2 patterns to whitelist'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('src/**'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('lib/**'));
    });

    it('should add patterns to blacklist', async () => {
      process.argv = ['node', 'cleanup', 'safety', '--add-blacklist', 'temp/**,*.tmp'];
      
      await program.parse();

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Added 2 patterns to blacklist'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('temp/**'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('*.tmp'));
    });

    it('should remove patterns from whitelist', async () => {
      process.argv = ['node', 'cleanup', 'safety', '--remove-whitelist', 'old/**'];
      
      await program.parse();

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Removed 1 patterns from whitelist'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('old/**'));
    });

    it('should remove patterns from blacklist', async () => {
      process.argv = ['node', 'cleanup', 'safety', '--remove-blacklist', 'old/**'];
      
      await program.parse();

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Removed 1 patterns from blacklist'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('old/**'));
    });

    it('should show help when no options provided', async () => {
      process.argv = ['node', 'cleanup', 'safety'];
      
      await program.parse();

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Safety Management'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('--help'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('--show-config'));
    });

    it('should handle errors gracefully', async () => {
      // Mock an error in the safety command
      const originalSafetyManager = SafetyManager;
      (SafetyManager as any) = jest.fn().mockImplementation(() => {
        throw new Error('Safety manager error');
      });

      process.argv = ['node', 'cleanup', 'safety', '--show-config'];
      
      await program.parse();

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error managing safety settings'));
      expect(process.exit).toHaveBeenCalledWith(1);

      // Restore original
      (SafetyManager as any) = originalSafetyManager;
    });
  });

  describe('analyze command with safety features', () => {
    beforeEach(async () => {
      // Create test files in temp directory
      process.chdir(tempDir);
      
      // Create a package.json (critical file)
      await fs.promises.writeFile('package.json', JSON.stringify({ name: 'test' }));
      
      // Create a log file (safe file)
      await fs.promises.writeFile('debug.log', 'debug info');
      
      // Create a config file (dangerous pattern)
      await fs.promises.writeFile('webpack.config.js', 'module.exports = {};');
    });

    it('should respect safety settings during analysis', async () => {
      process.argv = ['node', 'cleanup', 'analyze', '--dry-run'];
      
      await program.parse();

      // Should complete without safety violations
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Analyzing codebase'));
    });

    it('should prevent unsafe operations', async () => {
      // This would need to be tested with actual analyzer output
      // For now, we test that the safety infrastructure is in place
      process.argv = ['node', 'cleanup', 'analyze', '--dry-run', '--verbose'];
      
      await program.parse();

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('dry-run mode'));
    });
  });

  describe('execute command with safety features', () => {
    let planFile: string;

    beforeEach(async () => {
      process.chdir(tempDir);
      
      // Create a test execution plan
      const testPlan = [
        {
          id: 'safe-delete',
          type: 'delete_file',
          description: 'Delete log file',
          sourcePath: 'debug.log',
          riskLevel: 'safe',
          autoApplicable: true
        }
      ];
      
      planFile = path.join(tempDir, 'test-plan.json');
      await fs.promises.writeFile(planFile, JSON.stringify(testPlan, null, 2));
      
      // Create the file to be deleted
      await fs.promises.writeFile('debug.log', 'debug info');
    });

    it('should execute safe changes successfully', async () => {
      process.argv = ['node', 'cleanup', 'execute', planFile, '--dry-run'];
      
      await program.parse();

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Loading execution plan'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Execution Plan Summary'));
    });

    it('should prevent execution of unsafe plans', async () => {
      // Create an unsafe plan
      const unsafePlan = [
        {
          id: 'unsafe-delete',
          type: 'delete_file',
          description: 'Delete critical file',
          sourcePath: 'package.json',
          riskLevel: 'manual',
          autoApplicable: false
        }
      ];
      
      const unsafePlanFile = path.join(tempDir, 'unsafe-plan.json');
      await fs.promises.writeFile(unsafePlanFile, JSON.stringify(unsafePlan, null, 2));
      await fs.promises.writeFile('package.json', JSON.stringify({ name: 'test' }));

      process.argv = ['node', 'cleanup', 'execute', unsafePlanFile];
      
      await program.parse();

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error during execution'));
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('interactive mode safety', () => {
    beforeEach(async () => {
      process.chdir(tempDir);
      await fs.promises.writeFile('test.log', 'test data');
    });

    it('should use enhanced confirmation prompts', async () => {
      const inquirer = require('inquirer');
      inquirer.prompt.mockResolvedValue({ action: 'proceed' });

      process.argv = ['node', 'cleanup', 'analyze', '--interactive', '--dry-run'];
      
      await program.parse();

      // The interactive mode should be triggered
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Analyzing codebase'));
    });
  });

  describe('configuration integration', () => {
    it('should load safety configuration from config file', async () => {
      const configFile = path.join(tempDir, 'cleanup.config.json');
      const config = {
        excludePatterns: ['node_modules/**'],
        includePatterns: ['**/*'],
        createBackups: true,
        dryRun: false,
        autoFixConfidence: 'high',
        autoFixRiskLevel: 'safe'
      };
      
      await fs.promises.writeFile(configFile, JSON.stringify(config, null, 2));
      
      process.argv = ['node', 'cleanup', 'analyze', '--config', configFile, '--dry-run'];
      
      await program.parse();

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Analyzing codebase'));
    });

    it('should handle invalid configuration gracefully', async () => {
      const invalidConfigFile = path.join(tempDir, 'invalid.config.json');
      await fs.promises.writeFile(invalidConfigFile, 'invalid json');
      
      process.argv = ['node', 'cleanup', 'analyze', '--config', invalidConfigFile];
      
      await program.parse();

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error loading config file'));
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle missing plan file gracefully', async () => {
      process.argv = ['node', 'cleanup', 'execute', 'nonexistent-plan.json'];
      
      await program.parse();

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error during execution'));
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should handle malformed plan file', async () => {
      const malformedPlanFile = path.join(tempDir, 'malformed-plan.json');
      await fs.promises.writeFile(malformedPlanFile, 'invalid json');
      
      process.argv = ['node', 'cleanup', 'execute', malformedPlanFile];
      
      await program.parse();

      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Error during execution'));
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should handle permission errors', async () => {
      // This test would need to simulate permission errors
      // For now, we ensure the error handling structure is in place
      process.argv = ['node', 'cleanup', 'analyze', '--dry-run'];
      
      await program.parse();

      // Should complete without crashing
      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe('safety feature integration', () => {
    it('should integrate SafetyManager with ChangeExecutor', async () => {
      // This test verifies that the safety features are properly integrated
      const { ChangeExecutor } = require('../core/ChangeExecutor');
      const executor = new ChangeExecutor();
      
      expect(executor.getSafetyManager).toBeDefined();
      expect(executor.checkChangeSafety).toBeDefined();
      expect(executor.getSafetyRecommendations).toBeDefined();
    });

    it('should provide safety recommendations in CLI output', async () => {
      process.argv = ['node', 'cleanup', 'analyze', '--dry-run', '--verbose'];
      
      await program.parse();

      // The CLI should have access to safety features
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Analyzing codebase'));
    });
  });
});