import inquirer from 'inquirer';
import { Change, RiskLevel } from '../types';
import { SafetyCheckResult } from '../core/SafetyManager';

/**
 * Utility class for handling confirmation prompts for high-risk operations
 */
export class ConfirmationPrompts {
  
  /**
   * Prompt user for confirmation of a high-risk change
   */
  static async confirmHighRiskChange(
    change: Change, 
    safetyResult: SafetyCheckResult
  ): Promise<boolean> {
    console.log('\n⚠️  HIGH RISK OPERATION DETECTED ⚠️');
    console.log('═'.repeat(50));
    console.log(`Operation: ${change.type.toUpperCase()}`);
    console.log(`Description: ${change.description}`);
    console.log(`Risk Level: ${change.riskLevel.toUpperCase()}`);
    console.log(`Safety Assessment: ${safetyResult.reason}`);
    
    if (change.sourcePath) {
      console.log(`Source File: ${change.sourcePath}`);
    }
    if (change.targetPath) {
      console.log(`Target File: ${change.targetPath}`);
    }
    
    if (safetyResult.suggestion) {
      console.log(`\n💡 Suggestion: ${safetyResult.suggestion}`);
    }

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'How would you like to proceed?',
        choices: [
          { name: '✅ Proceed with this operation', value: 'proceed' },
          { name: '⏭️  Skip this operation', value: 'skip' },
          { name: '📋 View detailed information', value: 'details' },
          { name: '🛑 Abort entire process', value: 'abort' }
        ]
      }
    ]);

    switch (answer.action) {
      case 'proceed':
        return true;
      case 'skip':
        return false;
      case 'details':
        await this.showDetailedInformation(change, safetyResult);
        return await this.confirmHighRiskChange(change, safetyResult);
      case 'abort':
        throw new Error('Operation aborted by user');
      default:
        return false;
    }
  }

  /**
   * Prompt for batch confirmation of multiple high-risk changes
   */
  static async confirmBatchChanges(
    changes: Change[], 
    safetyResults: SafetyCheckResult[]
  ): Promise<{ proceed: boolean; selectedChanges?: Change[] }> {
    const highRiskChanges = changes.filter((_, index) => 
      safetyResults[index].riskLevel === 'manual' || 
      safetyResults[index].requiresConfirmation
    );

    if (highRiskChanges.length === 0) {
      return { proceed: true };
    }

    console.log('\n⚠️  BATCH OPERATION SAFETY REVIEW ⚠️');
    console.log('═'.repeat(50));
    console.log(`Total changes: ${changes.length}`);
    console.log(`High-risk changes: ${highRiskChanges.length}`);
    console.log(`Safe changes: ${changes.length - highRiskChanges.length}`);

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'How would you like to proceed with the batch operation?',
        choices: [
          { name: '✅ Proceed with all changes', value: 'all' },
          { name: '🔍 Review each high-risk change individually', value: 'review' },
          { name: '✨ Execute only safe changes', value: 'safe_only' },
          { name: '🛑 Cancel entire operation', value: 'cancel' }
        ]
      }
    ]);

    switch (answer.action) {
      case 'all':
        return { proceed: true };
      case 'review':
        return await this.reviewIndividualChanges(changes, safetyResults);
      case 'safe_only':
        const safeChanges = changes.filter((_, index) => 
          safetyResults[index].riskLevel === 'safe' && 
          !safetyResults[index].requiresConfirmation
        );
        return { proceed: true, selectedChanges: safeChanges };
      case 'cancel':
        return { proceed: false };
      default:
        return { proceed: false };
    }
  }

  /**
   * Prompt for confirmation of critical file operations
   */
  static async confirmCriticalFileOperation(
    change: Change,
    recommendations: string[]
  ): Promise<boolean> {
    console.log('\n🚨 CRITICAL FILE OPERATION 🚨');
    console.log('═'.repeat(50));
    console.log(`This operation affects a critical system file!`);
    console.log(`File: ${change.sourcePath || change.targetPath}`);
    console.log(`Operation: ${change.type}`);
    console.log(`Description: ${change.description}`);

    if (recommendations.length > 0) {
      console.log('\n📋 Safety Recommendations:');
      recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    console.log('\n⚠️  WARNING: This operation could potentially break your application!');

    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: 'Are you absolutely sure you want to proceed?',
        default: false
      }
    ]);

    if (answer.confirmed) {
      const doubleConfirm = await inquirer.prompt([
        {
          type: 'input',
          name: 'confirmation',
          message: 'Type "I understand the risks" to confirm:',
          validate: (input: string) => {
            return input === 'I understand the risks' || 'Please type exactly: "I understand the risks"';
          }
        }
      ]);

      return doubleConfirm.confirmation === 'I understand the risks';
    }

    return false;
  }

  /**
   * Show detailed information about a change
   */
  private static async showDetailedInformation(
    change: Change, 
    safetyResult: SafetyCheckResult
  ): Promise<void> {
    console.log('\n📋 DETAILED INFORMATION');
    console.log('═'.repeat(30));
    console.log(`Change ID: ${change.id}`);
    console.log(`Type: ${change.type}`);
    console.log(`Description: ${change.description}`);
    console.log(`Risk Level: ${change.riskLevel}`);
    console.log(`Auto-applicable: ${change.autoApplicable}`);
    
    if (change.sourcePath) {
      console.log(`Source Path: ${change.sourcePath}`);
    }
    if (change.targetPath) {
      console.log(`Target Path: ${change.targetPath}`);
    }
    if (change.content) {
      console.log(`Content Length: ${change.content.length} characters`);
    }

    console.log('\n🔍 Safety Assessment:');
    console.log(`Safe: ${safetyResult.safe}`);
    console.log(`Risk Level: ${safetyResult.riskLevel}`);
    console.log(`Requires Confirmation: ${safetyResult.requiresConfirmation}`);
    console.log(`Reason: ${safetyResult.reason}`);
    
    if (safetyResult.suggestion) {
      console.log(`Suggestion: ${safetyResult.suggestion}`);
    }

    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press Enter to continue...'
      }
    ]);
  }

  /**
   * Review individual changes in a batch
   */
  private static async reviewIndividualChanges(
    changes: Change[], 
    safetyResults: SafetyCheckResult[]
  ): Promise<{ proceed: boolean; selectedChanges?: Change[] }> {
    const selectedChanges: Change[] = [];
    
    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      const safetyResult = safetyResults[i];
      
      // Auto-include safe changes
      if (safetyResult.riskLevel === 'safe' && !safetyResult.requiresConfirmation) {
        selectedChanges.push(change);
        continue;
      }

      console.log(`\n--- Change ${i + 1} of ${changes.length} ---`);
      
      try {
        const confirmed = await this.confirmHighRiskChange(change, safetyResult);
        if (confirmed) {
          selectedChanges.push(change);
        }
      } catch (error) {
        // User aborted
        return { proceed: false };
      }
    }

    return { proceed: true, selectedChanges };
  }

  /**
   * Prompt for whitelist/blacklist management
   */
  static async promptForListManagement(): Promise<{
    action: 'add_whitelist' | 'add_blacklist' | 'remove_whitelist' | 'remove_blacklist' | 'none';
    patterns?: string[];
  }> {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Would you like to manage whitelist/blacklist patterns?',
        choices: [
          { name: 'Add patterns to whitelist', value: 'add_whitelist' },
          { name: 'Add patterns to blacklist', value: 'add_blacklist' },
          { name: 'Remove patterns from whitelist', value: 'remove_whitelist' },
          { name: 'Remove patterns from blacklist', value: 'remove_blacklist' },
          { name: 'No changes needed', value: 'none' }
        ]
      }
    ]);

    if (answer.action === 'none') {
      return { action: 'none' };
    }

    const patternsAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'patterns',
        message: 'Enter patterns (comma-separated):',
        validate: (input: string) => {
          return input.trim().length > 0 || 'Please enter at least one pattern';
        }
      }
    ]);

    const patterns = patternsAnswer.patterns
      .split(',')
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);

    return { action: answer.action, patterns };
  }
}