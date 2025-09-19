import * as path from 'path';
import * as fs from 'fs';
import { Change, RiskLevel } from '../types';

/**
 * Configuration for safety rules
 */
export interface SafetyConfig {
  /** Files that should never be deleted or modified */
  criticalFiles: string[];
  /** Directories that should never be deleted */
  criticalDirectories: string[];
  /** File patterns that are always safe to modify */
  safePatterns: string[];
  /** File patterns that require manual review */
  dangerousPatterns: string[];
  /** Whitelist of files/patterns that are explicitly allowed */
  whitelist: string[];
  /** Blacklist of files/patterns that are explicitly forbidden */
  blacklist: string[];
  /** Whether to require confirmation for high-risk operations */
  requireConfirmation: boolean;
  /** Maximum file size (in bytes) that can be deleted without confirmation */
  maxAutoDeleteSize: number;
}

/**
 * Safety check result
 */
export interface SafetyCheckResult {
  /** Whether the change is safe to execute */
  safe: boolean;
  /** Risk level assessment */
  riskLevel: RiskLevel;
  /** Reason for the safety assessment */
  reason: string;
  /** Whether confirmation is required */
  requiresConfirmation: boolean;
  /** Suggested alternative action if unsafe */
  suggestion?: string;
}

/**
 * Manages safety checks and protections for file operations
 */
export class SafetyManager {
  private config: SafetyConfig;

  constructor(config?: Partial<SafetyConfig>) {
    this.config = {
      criticalFiles: [
        'package.json',
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
        'tsconfig.json',
        'tsconfig.*.json',
        '.gitignore',
        '.env',
        '.env.local',
        '.env.production',
        'docker-compose.yml',
        'Dockerfile',
        'README.md',
        'LICENSE',
        'CHANGELOG.md'
      ],
      criticalDirectories: [
        '.git',
        'node_modules',
        'src',
        'lib',
        'dist',
        'build',
        'apps',
        'packages'
      ],
      safePatterns: [
        '**/*.log',
        '**/*.tmp',
        '**/*.temp',
        '**/*.cache',
        '**/temp/**',
        '**/tmp/**',
        '**/.DS_Store',
        '**/Thumbs.db',
        '**/*.backup',
        '**/*.bak'
      ],
      dangerousPatterns: [
        '**/package.json',
        '**/tsconfig*.json',
        '**/.env*',
        '**/docker*',
        '**/Dockerfile*',
        '**/*.config.js',
        '**/*.config.ts',
        '**/webpack*.js',
        '**/vite*.js',
        '**/rollup*.js'
      ],
      whitelist: [],
      blacklist: [
        '.git/**',
        'node_modules/**',
        '.cleanup-backups/**'
      ],
      requireConfirmation: true,
      maxAutoDeleteSize: 1024 * 1024, // 1MB
      ...config
    };
  }

  /**
   * Check if a change is safe to execute
   */
  async checkChangeSafety(change: Change): Promise<SafetyCheckResult> {
    const filePath = change.sourcePath || change.targetPath;
    if (!filePath) {
      return {
        safe: false,
        riskLevel: 'manual',
        reason: 'Change has no file path specified',
        requiresConfirmation: true
      };
    }

    // Check blacklist first
    if (this.isBlacklisted(filePath)) {
      return {
        safe: false,
        riskLevel: 'manual',
        reason: `File is blacklisted: ${filePath}`,
        requiresConfirmation: true,
        suggestion: 'Remove from blacklist if this operation is intentional'
      };
    }

    // Check whitelist - if whitelisted, it's generally safe
    if (this.isWhitelisted(filePath)) {
      return {
        safe: true,
        riskLevel: 'safe',
        reason: `File is whitelisted: ${filePath}`,
        requiresConfirmation: false
      };
    }

    // Check safe patterns first (before critical files)
    if (this.matchesSafePattern(filePath)) {
      return {
        safe: true,
        riskLevel: 'safe',
        reason: `File matches safe pattern: ${filePath}`,
        requiresConfirmation: false
      };
    }

    // Check critical files
    if (this.isCriticalFile(filePath)) {
      return await this.assessCriticalFileChange(change);
    }

    // Check critical directories
    if (this.affectsCriticalDirectory(change)) {
      return {
        safe: false,
        riskLevel: 'manual',
        reason: `Change affects critical directory: ${filePath}`,
        requiresConfirmation: true,
        suggestion: 'Manually review the impact on critical system directories'
      };
    }

    // Check dangerous patterns
    if (this.matchesDangerousPattern(filePath)) {
      return {
        safe: false,
        riskLevel: 'review',
        reason: `File matches dangerous pattern: ${filePath}`,
        requiresConfirmation: true,
        suggestion: 'Review the change carefully before applying'
      };
    }

    // Check file size for delete operations
    if (change.type === 'delete_file') {
      const sizeCheck = await this.checkFileSize(filePath);
      if (!sizeCheck.safe) {
        return sizeCheck;
      }
    }

    // Default assessment based on change type
    return this.assessChangeByType(change);
  }

  /**
   * Check if multiple changes are safe to execute together
   */
  async checkBatchSafety(changes: Change[]): Promise<SafetyCheckResult> {
    const results = await Promise.all(
      changes.map(change => this.checkChangeSafety(change))
    );

    const unsafeChanges = results.filter(r => !r.safe);
    const highRiskChanges = results.filter(r => r.riskLevel === 'manual');
    const reviewChanges = results.filter(r => r.riskLevel === 'review');

    if (unsafeChanges.length > 0) {
      return {
        safe: false,
        riskLevel: 'manual',
        reason: `${unsafeChanges.length} unsafe changes detected`,
        requiresConfirmation: true,
        suggestion: 'Review and fix unsafe changes before proceeding'
      };
    }

    if (highRiskChanges.length > 0) {
      return {
        safe: true,
        riskLevel: 'manual',
        reason: `${highRiskChanges.length} high-risk changes require manual review`,
        requiresConfirmation: true
      };
    }

    if (reviewChanges.length > 0) {
      return {
        safe: true,
        riskLevel: 'review',
        reason: `${reviewChanges.length} changes require review`,
        requiresConfirmation: this.config.requireConfirmation
      };
    }

    return {
      safe: true,
      riskLevel: 'safe',
      reason: 'All changes are safe to execute',
      requiresConfirmation: false
    };
  }

  /**
   * Get safety recommendations for a change
   */
  getSafetyRecommendations(change: Change): string[] {
    const recommendations: string[] = [];
    const filePath = change.sourcePath || change.targetPath;

    if (!filePath) {
      recommendations.push('Ensure all changes have valid file paths');
      return recommendations;
    }

    if (this.isCriticalFile(filePath)) {
      recommendations.push('Create a backup before modifying critical files');
      recommendations.push('Test the change in a development environment first');
      recommendations.push('Have the change reviewed by another team member');
    }

    if (change.type === 'delete_file') {
      recommendations.push('Verify the file is not referenced elsewhere in the codebase');
      recommendations.push('Check if the file is imported by other modules');
    }

    if (change.type === 'move_file') {
      recommendations.push('Update all import statements that reference the moved file');
      recommendations.push('Check for hardcoded file paths in configuration files');
    }

    if (change.type === 'update_package_json') {
      recommendations.push('Run npm/yarn install after updating package.json');
      recommendations.push('Verify all dependencies are still compatible');
      recommendations.push('Test the application after dependency changes');
    }

    return recommendations;
  }

  /**
   * Update safety configuration
   */
  updateConfig(newConfig: Partial<SafetyConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Add files/patterns to whitelist
   */
  addToWhitelist(patterns: string[]): void {
    this.config.whitelist.push(...patterns);
  }

  /**
   * Add files/patterns to blacklist
   */
  addToBlacklist(patterns: string[]): void {
    this.config.blacklist.push(...patterns);
  }

  /**
   * Remove files/patterns from whitelist
   */
  removeFromWhitelist(patterns: string[]): void {
    this.config.whitelist = this.config.whitelist.filter(
      pattern => !patterns.includes(pattern)
    );
  }

  /**
   * Remove files/patterns from blacklist
   */
  removeFromBlacklist(patterns: string[]): void {
    this.config.blacklist = this.config.blacklist.filter(
      pattern => !patterns.includes(pattern)
    );
  }

  /**
   * Get current safety configuration
   */
  getConfig(): SafetyConfig {
    return { ...this.config };
  }

  // Private helper methods

  private isCriticalFile(filePath: string): boolean {
    const fileName = path.basename(filePath);
    return this.config.criticalFiles.some(pattern => {
      if (pattern.includes('*')) {
        return this.matchesGlob(fileName, pattern);
      }
      return fileName === pattern;
    });
  }

  private affectsCriticalDirectory(change: Change): boolean {
    const filePath = change.sourcePath || change.targetPath;
    if (!filePath) return false;

    const dirPath = path.dirname(filePath);
    return this.config.criticalDirectories.some(criticalDir => {
      return dirPath.startsWith(criticalDir) || dirPath === criticalDir;
    });
  }

  private isWhitelisted(filePath: string): boolean {
    return this.config.whitelist.some(pattern => 
      this.matchesGlob(filePath, pattern)
    );
  }

  private isBlacklisted(filePath: string): boolean {
    return this.config.blacklist.some(pattern => 
      this.matchesGlob(filePath, pattern)
    );
  }

  private matchesSafePattern(filePath: string): boolean {
    return this.config.safePatterns.some(pattern => 
      this.matchesGlob(filePath, pattern)
    );
  }

  private matchesDangerousPattern(filePath: string): boolean {
    return this.config.dangerousPatterns.some(pattern => 
      this.matchesGlob(filePath, pattern)
    );
  }

  private async assessCriticalFileChange(change: Change): Promise<SafetyCheckResult> {
    const filePath = change.sourcePath || change.targetPath!;
    
    switch (change.type) {
      case 'delete_file':
        return {
          safe: false,
          riskLevel: 'manual',
          reason: `Attempting to delete critical file: ${filePath}`,
          requiresConfirmation: true,
          suggestion: 'Critical files should not be deleted. Consider moving or renaming instead.'
        };

      case 'modify_file':
      case 'update_package_json':
        return {
          safe: true,
          riskLevel: 'review',
          reason: `Modifying critical file: ${filePath}`,
          requiresConfirmation: true,
          suggestion: 'Review changes carefully and create a backup before proceeding.'
        };

      case 'move_file':
        return {
          safe: false,
          riskLevel: 'manual',
          reason: `Attempting to move critical file: ${filePath}`,
          requiresConfirmation: true,
          suggestion: 'Moving critical files can break the build. Update all references first.'
        };

      default:
        return {
          safe: true,
          riskLevel: 'review',
          reason: `Operation on critical file: ${filePath}`,
          requiresConfirmation: true
        };
    }
  }

  private async checkFileSize(filePath: string): Promise<SafetyCheckResult> {
    try {
      const stats = await fs.promises.stat(filePath);
      if (stats.size > this.config.maxAutoDeleteSize) {
        return {
          safe: false,
          riskLevel: 'review',
          reason: `File is large (${this.formatFileSize(stats.size)}) and requires confirmation`,
          requiresConfirmation: true,
          suggestion: 'Review the file contents before deletion'
        };
      }
    } catch (error) {
      // File doesn't exist or can't be accessed
      return {
        safe: false,
        riskLevel: 'manual',
        reason: `Cannot access file for size check: ${filePath}`,
        requiresConfirmation: true
      };
    }

    return {
      safe: true,
      riskLevel: 'safe',
      reason: 'File size is within safe limits',
      requiresConfirmation: false
    };
  }

  private assessChangeByType(change: Change): SafetyCheckResult {
    switch (change.type) {
      case 'delete_file':
        // If it's already marked as safe by the change itself, trust it
        if (change.riskLevel === 'safe') {
          return {
            safe: true,
            riskLevel: 'safe',
            reason: 'File deletion marked as safe',
            requiresConfirmation: false
          };
        }
        return {
          safe: true,
          riskLevel: 'review',
          reason: 'File deletion requires review',
          requiresConfirmation: this.config.requireConfirmation
        };

      case 'move_file':
        return {
          safe: true,
          riskLevel: 'review',
          reason: 'File move may affect imports and references',
          requiresConfirmation: this.config.requireConfirmation
        };

      case 'modify_file':
        return {
          safe: true,
          riskLevel: 'safe',
          reason: 'File modification is generally safe',
          requiresConfirmation: false
        };

      case 'create_file':
        return {
          safe: true,
          riskLevel: 'safe',
          reason: 'File creation is safe',
          requiresConfirmation: false
        };

      case 'update_package_json':
        return {
          safe: true,
          riskLevel: 'review',
          reason: 'Package.json updates can affect dependencies',
          requiresConfirmation: true
        };

      default:
        return {
          safe: false,
          riskLevel: 'manual',
          reason: `Unknown change type: ${change.type}`,
          requiresConfirmation: true
        };
    }
  }

  private matchesGlob(filePath: string, pattern: string): boolean {
    // Simple glob matching - in a real implementation, you'd use a proper glob library
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/\\\\]*')
      .replace(/\?/g, '[^/\\\\]')
      .replace(/\./g, '\\.');
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(filePath.replace(/\\/g, '/'));
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}