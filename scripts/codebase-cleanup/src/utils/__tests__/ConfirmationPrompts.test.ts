import { ConfirmationPrompts } from '../ConfirmationPrompts';
import { Change } from '../../types';
import { SafetyCheckResult } from '../../core/SafetyManager';
import inquirer from 'inquirer';

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

const mockInquirer = inquirer as jest.Mocked<typeof inquirer>;

describe('ConfirmationPrompts', () => {
  let mockChange: Change;
  let mockSafetyResult: SafetyCheckResult;

  beforeEach(() => {
    mockChange = {
      id: 'test-change',
      type: 'delete_file',
      description: 'Test change description',
      sourcePath: 'test/file.js',
      riskLevel: 'manual',
      autoApplicable: false
    };

    mockSafetyResult = {
      safe: false,
      riskLevel: 'manual',
      reason: 'High risk operation detected',
      requiresConfirmation: true,
      suggestion: 'Consider alternative approach'
    };

    jest.clearAllMocks();
  });

  describe('confirmHighRiskChange', () => {
    it('should return true when user chooses to proceed', async () => {
      mockInquirer.prompt.mockResolvedValue({ action: 'proceed' });

      const result = await ConfirmationPrompts.confirmHighRiskChange(mockChange, mockSafetyResult);

      expect(result).toBe(true);
      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'list',
          name: 'action',
          message: 'How would you like to proceed?'
        })
      ]);
    });

    it('should return false when user chooses to skip', async () => {
      mockInquirer.prompt.mockResolvedValue({ action: 'skip' });

      const result = await ConfirmationPrompts.confirmHighRiskChange(mockChange, mockSafetyResult);

      expect(result).toBe(false);
    });

    it('should throw error when user chooses to abort', async () => {
      mockInquirer.prompt.mockResolvedValue({ action: 'abort' });

      await expect(
        ConfirmationPrompts.confirmHighRiskChange(mockChange, mockSafetyResult)
      ).rejects.toThrow('Operation aborted by user');
    });

    it('should show details and re-prompt when user chooses details', async () => {
      mockInquirer.prompt
        .mockResolvedValueOnce({ action: 'details' })
        .mockResolvedValueOnce({ continue: '' })
        .mockResolvedValueOnce({ action: 'proceed' });

      const result = await ConfirmationPrompts.confirmHighRiskChange(mockChange, mockSafetyResult);

      expect(result).toBe(true);
      expect(mockInquirer.prompt).toHaveBeenCalledTimes(3);
    });

    it('should display all relevant information', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockInquirer.prompt.mockResolvedValue({ action: 'proceed' });

      await ConfirmationPrompts.confirmHighRiskChange(mockChange, mockSafetyResult);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('HIGH RISK OPERATION'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DELETE_FILE'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test change description'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('MANUAL'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test/file.js'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Consider alternative approach'));

      consoleSpy.mockRestore();
    });
  });

  describe('confirmBatchChanges', () => {
    let mockChanges: Change[];
    let mockSafetyResults: SafetyCheckResult[];

    beforeEach(() => {
      mockChanges = [
        mockChange,
        {
          ...mockChange,
          id: 'safe-change',
          riskLevel: 'safe'
        }
      ];

      mockSafetyResults = [
        mockSafetyResult,
        {
          safe: true,
          riskLevel: 'safe',
          reason: 'Safe operation',
          requiresConfirmation: false
        }
      ];
    });

    it('should return proceed true for all safe changes', async () => {
      const safeResults = mockSafetyResults.map(r => ({ ...r, riskLevel: 'safe' as const, requiresConfirmation: false }));

      const result = await ConfirmationPrompts.confirmBatchChanges(mockChanges, safeResults);

      expect(result.proceed).toBe(true);
      expect(result.selectedChanges).toBeUndefined();
      expect(mockInquirer.prompt).not.toHaveBeenCalled();
    });

    it('should prompt when high-risk changes are present', async () => {
      mockInquirer.prompt.mockResolvedValue({ action: 'all' });

      const result = await ConfirmationPrompts.confirmBatchChanges(mockChanges, mockSafetyResults);

      expect(result.proceed).toBe(true);
      expect(mockInquirer.prompt).toHaveBeenCalled();
    });

    it('should return only safe changes when user chooses safe_only', async () => {
      mockInquirer.prompt.mockResolvedValue({ action: 'safe_only' });

      const result = await ConfirmationPrompts.confirmBatchChanges(mockChanges, mockSafetyResults);

      expect(result.proceed).toBe(true);
      expect(result.selectedChanges).toHaveLength(1);
      expect(result.selectedChanges![0].id).toBe('safe-change');
    });

    it('should return proceed false when user cancels', async () => {
      mockInquirer.prompt.mockResolvedValue({ action: 'cancel' });

      const result = await ConfirmationPrompts.confirmBatchChanges(mockChanges, mockSafetyResults);

      expect(result.proceed).toBe(false);
    });

    it('should handle individual review mode', async () => {
      mockInquirer.prompt
        .mockResolvedValueOnce({ action: 'review' })
        .mockResolvedValueOnce({ action: 'skip' }); // For the high-risk change

      const result = await ConfirmationPrompts.confirmBatchChanges(mockChanges, mockSafetyResults);

      expect(result.proceed).toBe(true);
      expect(result.selectedChanges).toHaveLength(1); // Only the safe change
      expect(result.selectedChanges![0].id).toBe('safe-change');
    });
  });

  describe('confirmCriticalFileOperation', () => {
    const mockRecommendations = [
      'Create a backup before proceeding',
      'Test in development environment first',
      'Have changes reviewed by team'
    ];

    it('should require double confirmation for critical files', async () => {
      mockInquirer.prompt
        .mockResolvedValueOnce({ confirmed: true })
        .mockResolvedValueOnce({ confirmation: 'I understand the risks' });

      const result = await ConfirmationPrompts.confirmCriticalFileOperation(mockChange, mockRecommendations);

      expect(result).toBe(true);
      expect(mockInquirer.prompt).toHaveBeenCalledTimes(2);
    });

    it('should return false if first confirmation is declined', async () => {
      mockInquirer.prompt.mockResolvedValueOnce({ confirmed: false });

      const result = await ConfirmationPrompts.confirmCriticalFileOperation(mockChange, mockRecommendations);

      expect(result).toBe(false);
      expect(mockInquirer.prompt).toHaveBeenCalledTimes(1);
    });

    it('should return false if second confirmation text is incorrect', async () => {
      mockInquirer.prompt
        .mockResolvedValueOnce({ confirmed: true })
        .mockResolvedValueOnce({ confirmation: 'wrong text' });

      const result = await ConfirmationPrompts.confirmCriticalFileOperation(mockChange, mockRecommendations);

      expect(result).toBe(false);
    });

    it('should display recommendations', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockInquirer.prompt.mockResolvedValueOnce({ confirmed: false });

      await ConfirmationPrompts.confirmCriticalFileOperation(mockChange, mockRecommendations);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('CRITICAL FILE OPERATION'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Safety Recommendations'));
      mockRecommendations.forEach(rec => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(rec));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('promptForListManagement', () => {
    it('should return none when user chooses no changes', async () => {
      mockInquirer.prompt.mockResolvedValue({ action: 'none' });

      const result = await ConfirmationPrompts.promptForListManagement();

      expect(result.action).toBe('none');
      expect(result.patterns).toBeUndefined();
    });

    it('should return patterns when user adds to whitelist', async () => {
      mockInquirer.prompt
        .mockResolvedValueOnce({ action: 'add_whitelist' })
        .mockResolvedValueOnce({ patterns: 'src/**, lib/**' });

      const result = await ConfirmationPrompts.promptForListManagement();

      expect(result.action).toBe('add_whitelist');
      expect(result.patterns).toEqual(['src/**', 'lib/**']);
    });

    it('should validate pattern input', async () => {
      const mockPrompt = jest.fn()
        .mockResolvedValueOnce({ action: 'add_blacklist' })
        .mockResolvedValueOnce({ patterns: 'temp/**' });

      mockInquirer.prompt = mockPrompt;

      await ConfirmationPrompts.promptForListManagement();

      // Check that validation function exists and works
      const patternPromptCall = mockPrompt.mock.calls[1][0][0];
      expect(patternPromptCall.validate('')).toBe('Please enter at least one pattern');
      expect(patternPromptCall.validate('valid pattern')).toBe(true);
    });

    it('should filter empty patterns', async () => {
      mockInquirer.prompt
        .mockResolvedValueOnce({ action: 'add_whitelist' })
        .mockResolvedValueOnce({ patterns: 'src/**, , lib/**, ' });

      const result = await ConfirmationPrompts.promptForListManagement();

      expect(result.patterns).toEqual(['src/**', 'lib/**']);
    });
  });

  describe('error handling', () => {
    it('should handle inquirer errors gracefully', async () => {
      mockInquirer.prompt.mockRejectedValue(new Error('Inquirer error'));

      await expect(
        ConfirmationPrompts.confirmHighRiskChange(mockChange, mockSafetyResult)
      ).rejects.toThrow('Inquirer error');
    });

    it('should handle missing change information', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockInquirer.prompt.mockResolvedValue({ action: 'proceed' });

      const incompleteChange: Change = {
        ...mockChange,
        sourcePath: undefined,
        targetPath: undefined
      };

      await ConfirmationPrompts.confirmHighRiskChange(incompleteChange, mockSafetyResult);

      // Should not crash and should still show available information
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DELETE_FILE'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('console output formatting', () => {
    it('should format output consistently', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockInquirer.prompt.mockResolvedValue({ action: 'proceed' });

      await ConfirmationPrompts.confirmHighRiskChange(mockChange, mockSafetyResult);

      // Check for consistent formatting
      const logCalls = consoleSpy.mock.calls.map(call => call[0]);
      expect(logCalls.some(call => call.includes('⚠️'))).toBe(true);
      expect(logCalls.some(call => call.includes('═'.repeat(50)))).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should handle long descriptions gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockInquirer.prompt.mockResolvedValue({ action: 'proceed' });

      const longDescriptionChange = {
        ...mockChange,
        description: 'A'.repeat(200)
      };

      await ConfirmationPrompts.confirmHighRiskChange(longDescriptionChange, mockSafetyResult);

      // Should not crash with long descriptions
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});