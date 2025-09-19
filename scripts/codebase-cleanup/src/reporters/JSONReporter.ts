/**
 * JSON reporter for machine-readable output
 */

import { promises as fs } from 'fs';
import { CleanupReport } from '../types';
import { Reporter } from './BaseReporter';

/**
 * Extended JSON report format with additional metadata
 */
interface JSONReportFormat {
  /** Report metadata */
  metadata: {
    /** Timestamp when report was generated */
    generatedAt: string;
    /** Version of the cleanup tool */
    toolVersion: string;
    /** Total analysis duration in milliseconds */
    analysisDuration?: number;
    /** Command line arguments used */
    arguments?: string[];
  };
  
  /** Original cleanup report data */
  report: CleanupReport;
  
  /** Additional statistics for machine processing */
  statistics: {
    /** Findings grouped by type with counts */
    findingsByType: Record<string, number>;
    /** Findings grouped by risk level with counts */
    findingsByRisk: Record<string, number>;
    /** Findings grouped by confidence level with counts */
    findingsByConfidence: Record<string, number>;
    /** Auto-fixable vs manual findings */
    autoFixableBreakdown: {
      autoFixable: number;
      manual: number;
      percentage: number;
    };
    /** File type distribution in analyzed files */
    fileTypeDistribution: Record<string, number>;
    /** Workspace distribution of findings */
    workspaceDistribution: Record<string, number>;
  };
  
  /** Validation information */
  validation: {
    /** Whether the report data is valid */
    isValid: boolean;
    /** Any validation errors found */
    errors: string[];
    /** Warnings about the report data */
    warnings: string[];
  };
}

/**
 * JSON reporter that outputs structured, machine-readable reports
 */
export class JSONReporter implements Reporter {
  readonly name = 'json';
  readonly fileExtension = 'json';
  
  async canRun(): Promise<boolean> {
    // JSON reporter can always run
    return true;
  }
  
  async generateReport(report: CleanupReport, outputPath?: string): Promise<string> {
    const jsonReport = this.createJSONReport(report);
    const jsonString = JSON.stringify(jsonReport, null, 2);
    
    if (outputPath) {
      await this.writeToFile(jsonString, outputPath);
    }
    
    return jsonString;
  }
  
  private createJSONReport(report: CleanupReport): JSONReportFormat {
    const statistics = this.calculateStatistics(report);
    const validation = this.validateReport(report);
    
    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        toolVersion: this.getToolVersion(),
        analysisDuration: undefined, // Will be set by orchestrator if available
        arguments: process.argv.slice(2)
      },
      report,
      statistics,
      validation
    };
  }
  
  private calculateStatistics(report: CleanupReport): JSONReportFormat['statistics'] {
    const allFindings = report.recommendations;
    
    // Group findings by type
    const findingsByType = allFindings.reduce((acc, finding) => {
      acc[finding.type] = (acc[finding.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Group findings by risk level (from categories)
    const findingsByRisk = Object.values(report.categories).reduce((acc, result) => {
      acc[result.riskLevel] = (acc[result.riskLevel] || 0) + result.findings.length;
      return acc;
    }, {} as Record<string, number>);
    
    // Group findings by confidence level
    const findingsByConfidence = Object.values(report.categories).reduce((acc, result) => {
      acc[result.confidence] = (acc[result.confidence] || 0) + result.findings.length;
      return acc;
    }, {} as Record<string, number>);
    
    // Auto-fixable breakdown
    const autoFixableCount = allFindings.filter(f => f.autoFixable).length;
    const manualCount = allFindings.length - autoFixableCount;
    const autoFixableBreakdown = {
      autoFixable: autoFixableCount,
      manual: manualCount,
      percentage: allFindings.length > 0 ? (autoFixableCount / allFindings.length) * 100 : 0
    };
    
    // File type distribution (would need file inventory data)
    const fileTypeDistribution: Record<string, number> = {};
    
    // Workspace distribution (extract from file paths in findings)
    const workspaceDistribution = this.calculateWorkspaceDistribution(allFindings);
    
    return {
      findingsByType,
      findingsByRisk,
      findingsByConfidence,
      autoFixableBreakdown,
      fileTypeDistribution,
      workspaceDistribution
    };
  }
  
  private calculateWorkspaceDistribution(findings: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    findings.forEach(finding => {
      finding.files.forEach((filePath: string) => {
        const workspace = this.getWorkspaceFromPath(filePath);
        distribution[workspace] = (distribution[workspace] || 0) + 1;
      });
    });
    
    return distribution;
  }
  
  private getWorkspaceFromPath(filePath: string): string {
    if (filePath.startsWith('apps/backend/')) return 'backend';
    if (filePath.startsWith('apps/frontend/')) return 'frontend';
    if (filePath.startsWith('packages/shared/')) return 'shared';
    if (filePath.startsWith('packages/types/')) return 'types';
    if (filePath.startsWith('packages/utils/')) return 'utils';
    return 'root';
  }
  
  private validateReport(report: CleanupReport): JSONReportFormat['validation'] {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate summary data
    if (report.summary.totalFiles < 0) {
      errors.push('Total files count cannot be negative');
    }
    
    if (report.summary.totalFindings < 0) {
      errors.push('Total findings count cannot be negative');
    }
    
    // Validate that summary matches actual data
    const actualFindingsCount = Object.values(report.categories)
      .reduce((sum, category) => sum + category.findings.length, 0);
    
    if (report.summary.totalFindings !== actualFindingsCount) {
      warnings.push(`Summary total findings (${report.summary.totalFindings}) doesn't match actual count (${actualFindingsCount})`);
    }
    
    // Validate categories
    Object.entries(report.categories).forEach(([analyzerName, result]) => {
      if (!result.analyzer) {
        errors.push(`Category ${analyzerName} missing analyzer name`);
      }
      
      if (!['high', 'medium', 'low'].includes(result.confidence)) {
        errors.push(`Invalid confidence level in ${analyzerName}: ${result.confidence}`);
      }
      
      if (!['safe', 'review', 'manual'].includes(result.riskLevel)) {
        errors.push(`Invalid risk level in ${analyzerName}: ${result.riskLevel}`);
      }
      
      // Validate findings
      result.findings.forEach((finding, index) => {
        if (!finding.description) {
          errors.push(`Finding ${index} in ${analyzerName} missing description`);
        }
        
        if (!finding.recommendation) {
          errors.push(`Finding ${index} in ${analyzerName} missing recommendation`);
        }
        
        if (!finding.files || finding.files.length === 0) {
          warnings.push(`Finding ${index} in ${analyzerName} has no associated files`);
        }
      });
    });
    
    // Validate recommendations array
    if (report.recommendations.length !== actualFindingsCount) {
      warnings.push('Recommendations array length doesn\'t match total findings');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  private getToolVersion(): string {
    // In a real implementation, this would read from package.json
    return '1.0.0';
  }
  
  private async writeToFile(content: string, filePath: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write JSON report to ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Parse a JSON report file back into a report object
   */
  static async parseReportFile(filePath: string): Promise<JSONReportFormat> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(content) as JSONReportFormat;
      
      // Validate the parsed data has required structure
      if (!parsed.report || !parsed.metadata) {
        throw new Error('Invalid JSON report format: missing required fields');
      }
      
      return parsed;
    } catch (error) {
      throw new Error(`Failed to parse JSON report from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Merge multiple JSON reports into a single report
   */
  static mergeReports(reports: JSONReportFormat[]): JSONReportFormat {
    if (reports.length === 0) {
      throw new Error('Cannot merge empty reports array');
    }
    
    if (reports.length === 1) {
      return reports[0];
    }
    
    const merged = JSON.parse(JSON.stringify(reports[0])) as JSONReportFormat;
    
    // Merge summary data
    for (let i = 1; i < reports.length; i++) {
      const report = reports[i];
      merged.report.summary.totalFiles += report.report.summary.totalFiles;
      merged.report.summary.totalFindings += report.report.summary.totalFindings;
      merged.report.summary.estimatedSavings.files += report.report.summary.estimatedSavings.files;
      merged.report.summary.estimatedSavings.dependencies += report.report.summary.estimatedSavings.dependencies;
      
      // Merge categories
      Object.assign(merged.report.categories, report.report.categories);
      
      // Merge recommendations
      merged.report.recommendations.push(...report.report.recommendations);
    }
    
    // Update metadata
    merged.metadata.generatedAt = new Date().toISOString();
    
    // Recalculate statistics
    const jsonReporter = new JSONReporter();
    merged.statistics = jsonReporter.calculateStatistics(merged.report);
    merged.validation = jsonReporter.validateReport(merged.report);
    
    return merged;
  }
}