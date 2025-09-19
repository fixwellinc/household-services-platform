/**
 * Base interface and utilities for all reporters
 */

import { CleanupReport, AnalysisResult, Finding } from '../types';

/**
 * Base interface that all reporters must implement
 */
export interface Reporter {
  /** Unique name identifier for this reporter */
  readonly name: string;
  
  /** File extension for output files (if applicable) */
  readonly fileExtension?: string;
  
  /**
   * Generate a report from the cleanup analysis results
   * @param report - Complete cleanup report data
   * @param outputPath - Optional path where report should be saved
   * @returns Promise resolving to the generated report content
   */
  generateReport(report: CleanupReport, outputPath?: string): Promise<string>;
  
  /**
   * Validate that this reporter can run with the current configuration
   * @returns Promise resolving to true if reporter can run, false otherwise
   */
  canRun(): Promise<boolean>;
}

/**
 * Utility functions for formatting report data
 */
export class ReportUtils {
  /**
   * Format file size in human-readable format
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
  
  /**
   * Format percentage with appropriate precision
   */
  static formatPercentage(value: number, total: number): string {
    if (total === 0) return '0%';
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(1)}%`;
  }
  
  /**
   * Sort findings by priority (risk level, then confidence, then impact)
   */
  static sortFindingsByPriority(findings: Finding[]): Finding[] {
    const riskOrder = { 'manual': 3, 'review': 2, 'safe': 1 };
    
    return findings.sort((a, b) => {
      // First sort by estimated impact (files + size)
      const aImpact = (a.estimatedSavings?.files || 0) + (a.estimatedSavings?.size || 0) / 1024;
      const bImpact = (b.estimatedSavings?.files || 0) + (b.estimatedSavings?.size || 0) / 1024;
      
      if (aImpact !== bImpact) {
        return bImpact - aImpact; // Higher impact first
      }
      
      // Then by type priority
      const typeOrder = { 'duplicate': 4, 'unused': 3, 'obsolete': 2, 'inconsistent': 1 };
      return (typeOrder[b.type] || 0) - (typeOrder[a.type] || 0);
    });
  }
  
  /**
   * Group findings by type for organized display
   */
  static groupFindingsByType(findings: Finding[]): Record<string, Finding[]> {
    return findings.reduce((groups, finding) => {
      const type = finding.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(finding);
      return groups;
    }, {} as Record<string, Finding[]>);
  }
  
  /**
   * Calculate total estimated savings across all findings
   */
  static calculateTotalSavings(findings: Finding[]): {
    files: number;
    size: number;
    dependencies: number;
  } {
    return findings.reduce((total, finding) => {
      return {
        files: total.files + (finding.estimatedSavings?.files || 0),
        size: total.size + (finding.estimatedSavings?.size || 0),
        dependencies: total.dependencies + (finding.estimatedSavings?.dependencies || 0)
      };
    }, { files: 0, size: 0, dependencies: 0 });
  }
  
  /**
   * Get risk level color for console output
   */
  static getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'safe': return '\x1b[32m'; // Green
      case 'review': return '\x1b[33m'; // Yellow
      case 'manual': return '\x1b[31m'; // Red
      default: return '\x1b[0m'; // Reset
    }
  }
  
  /**
   * Get finding type icon for display
   */
  static getTypeIcon(type: string): string {
    switch (type) {
      case 'duplicate': return '📋';
      case 'unused': return '🗑️';
      case 'obsolete': return '⏰';
      case 'inconsistent': return '⚠️';
      default: return '📄';
    }
  }
}