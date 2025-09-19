/**
 * Console reporter for terminal output with color coding and formatting
 */

import { CleanupReport, Finding, AnalysisResult } from '../types';
import { Reporter, ReportUtils } from './BaseReporter';

/**
 * ANSI color codes for terminal output
 */
const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
} as const;

/**
 * Console reporter that outputs formatted, colorized reports to the terminal
 */
export class ConsoleReporter implements Reporter {
  readonly name = 'console';
  
  async canRun(): Promise<boolean> {
    // Console reporter can always run
    return true;
  }
  
  async generateReport(report: CleanupReport, outputPath?: string): Promise<string> {
    const output: string[] = [];
    
    // Header
    output.push(this.createHeader());
    
    // Summary section
    output.push(this.createSummary(report));
    
    // Detailed findings by category
    output.push(this.createCategoryBreakdown(report));
    
    // Top recommendations
    output.push(this.createRecommendations(report));
    
    // Footer with next steps
    output.push(this.createFooter(report));
    
    const fullOutput = output.join('\n');
    
    // Output to console
    console.log(fullOutput);
    
    return fullOutput;
  }
  
  private createHeader(): string {
    const lines = [
      '',
      `${Colors.bright}${Colors.cyan}╔══════════════════════════════════════════════════════════════════════════════╗${Colors.reset}`,
      `${Colors.bright}${Colors.cyan}║                           CODEBASE CLEANUP REPORT                           ║${Colors.reset}`,
      `${Colors.bright}${Colors.cyan}╚══════════════════════════════════════════════════════════════════════════════╝${Colors.reset}`,
      ''
    ];
    return lines.join('\n');
  }
  
  private createSummary(report: CleanupReport): string {
    const { summary } = report;
    const lines = [
      `${Colors.bright}${Colors.blue}📊 SUMMARY${Colors.reset}`,
      `${Colors.dim}${'─'.repeat(50)}${Colors.reset}`,
      '',
      `${Colors.bright}Files Analyzed:${Colors.reset} ${Colors.green}${summary.totalFiles.toLocaleString()}${Colors.reset}`,
      `${Colors.bright}Issues Found:${Colors.reset} ${this.getIssueCountColor(summary.totalFindings)}${summary.totalFindings.toLocaleString()}${Colors.reset}`,
      '',
      `${Colors.bright}Estimated Savings:${Colors.reset}`,
      `  ${Colors.cyan}•${Colors.reset} Files to remove: ${Colors.yellow}${summary.estimatedSavings.files.toLocaleString()}${Colors.reset}`,
      `  ${Colors.cyan}•${Colors.reset} Disk space: ${Colors.yellow}${summary.estimatedSavings.diskSpace}${Colors.reset}`,
      `  ${Colors.cyan}•${Colors.reset} Dependencies: ${Colors.yellow}${summary.estimatedSavings.dependencies.toLocaleString()}${Colors.reset}`,
      ''
    ];
    return lines.join('\n');
  }
  
  private createCategoryBreakdown(report: CleanupReport): string {
    const lines = [
      `${Colors.bright}${Colors.blue}📋 ANALYSIS BREAKDOWN${Colors.reset}`,
      `${Colors.dim}${'─'.repeat(50)}${Colors.reset}`,
      ''
    ];
    
    Object.entries(report.categories).forEach(([analyzerName, result]) => {
      const findingCount = result.findings.length;
      const riskColor = this.getRiskLevelColor(result.riskLevel);
      const confidenceIcon = this.getConfidenceIcon(result.confidence);
      
      lines.push(`${Colors.bright}${analyzerName}${Colors.reset}`);
      lines.push(`  ${confidenceIcon} ${Colors.dim}Confidence: ${result.confidence}${Colors.reset} | ${riskColor}Risk: ${result.riskLevel}${Colors.reset}`);
      lines.push(`  ${Colors.cyan}•${Colors.reset} ${findingCount} finding${findingCount !== 1 ? 's' : ''}`);
      
      if (findingCount > 0) {
        const groupedFindings = ReportUtils.groupFindingsByType(result.findings);
        Object.entries(groupedFindings).forEach(([type, findings]) => {
          const icon = ReportUtils.getTypeIcon(type);
          lines.push(`    ${icon} ${findings.length} ${type} issue${findings.length !== 1 ? 's' : ''}`);
        });
      }
      
      lines.push('');
    });
    
    return lines.join('\n');
  }
  
  private createRecommendations(report: CleanupReport): string {
    const sortedFindings = ReportUtils.sortFindingsByPriority(report.recommendations);
    const topFindings = sortedFindings.slice(0, 10); // Show top 10
    
    const lines = [
      `${Colors.bright}${Colors.blue}🎯 TOP RECOMMENDATIONS${Colors.reset}`,
      `${Colors.dim}${'─'.repeat(50)}${Colors.reset}`,
      ''
    ];
    
    if (topFindings.length === 0) {
      lines.push(`${Colors.green}✅ No issues found! Your codebase is clean.${Colors.reset}`);
      lines.push('');
      return lines.join('\n');
    }
    
    topFindings.forEach((finding, index) => {
      const icon = ReportUtils.getTypeIcon(finding.type);
      const autoFixIcon = finding.autoFixable ? '🔧' : '👤';
      
      lines.push(`${Colors.bright}${index + 1}.${Colors.reset} ${icon} ${finding.description}`);
      lines.push(`   ${Colors.dim}${finding.recommendation}${Colors.reset}`);
      
      if (finding.estimatedSavings) {
        const savings = [];
        if (finding.estimatedSavings.files) {
          savings.push(`${finding.estimatedSavings.files} files`);
        }
        if (finding.estimatedSavings.size) {
          savings.push(ReportUtils.formatFileSize(finding.estimatedSavings.size));
        }
        if (finding.estimatedSavings.dependencies) {
          savings.push(`${finding.estimatedSavings.dependencies} deps`);
        }
        
        if (savings.length > 0) {
          lines.push(`   ${Colors.green}💾 Saves: ${savings.join(', ')}${Colors.reset}`);
        }
      }
      
      lines.push(`   ${autoFixIcon} ${finding.autoFixable ? 'Auto-fixable' : 'Manual review required'}`);
      lines.push('');
    });
    
    if (sortedFindings.length > 10) {
      lines.push(`${Colors.dim}... and ${sortedFindings.length - 10} more recommendations${Colors.reset}`);
      lines.push('');
    }
    
    return lines.join('\n');
  }
  
  private createFooter(report: CleanupReport): string {
    const autoFixableCount = report.recommendations.filter(f => f.autoFixable).length;
    const manualCount = report.recommendations.length - autoFixableCount;
    
    const lines = [
      `${Colors.bright}${Colors.blue}🚀 NEXT STEPS${Colors.reset}`,
      `${Colors.dim}${'─'.repeat(50)}${Colors.reset}`,
      ''
    ];
    
    if (autoFixableCount > 0) {
      lines.push(`${Colors.green}✨ ${autoFixableCount} issues can be automatically fixed${Colors.reset}`);
      lines.push(`   Run with ${Colors.cyan}--auto-fix${Colors.reset} to apply safe changes`);
      lines.push('');
    }
    
    if (manualCount > 0) {
      lines.push(`${Colors.yellow}⚠️  ${manualCount} issues require manual review${Colors.reset}`);
      lines.push(`   Use ${Colors.cyan}--interactive${Colors.reset} mode to review each change`);
      lines.push('');
    }
    
    lines.push(`${Colors.dim}Generate detailed reports:${Colors.reset}`);
    lines.push(`  ${Colors.cyan}--output-json report.json${Colors.reset}    Machine-readable format`);
    lines.push(`  ${Colors.cyan}--output-html report.html${Colors.reset}   Detailed web report`);
    lines.push('');
    
    return lines.join('\n');
  }
  
  /**
   * Create a progress bar for long-running operations
   */
  static createProgressBar(current: number, total: number, width: number = 40): string {
    const percentage = Math.min(100, Math.max(0, (current / total) * 100));
    const filled = Math.floor((percentage / 100) * width);
    const empty = width - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const percentText = `${percentage.toFixed(1)}%`.padStart(6);
    
    return `${Colors.cyan}[${bar}]${Colors.reset} ${percentText} (${current}/${total})`;
  }
  
  /**
   * Display progress information with spinner
   */
  static displayProgress(step: string, current: number, total: number): void {
    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧'][current % 8];
    const progressBar = ConsoleReporter.createProgressBar(current, total);
    
    process.stdout.write(`\r${Colors.cyan}${spinner}${Colors.reset} ${step} ${progressBar}`);
    
    if (current >= total) {
      process.stdout.write('\n');
    }
  }
  
  private getIssueCountColor(count: number): string {
    if (count === 0) return Colors.green;
    if (count < 10) return Colors.yellow;
    return Colors.red;
  }
  
  private getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'safe': return Colors.green;
      case 'review': return Colors.yellow;
      case 'manual': return Colors.red;
      default: return Colors.reset;
    }
  }
  
  private getConfidenceIcon(confidence: string): string {
    switch (confidence) {
      case 'high': return '🎯';
      case 'medium': return '🎲';
      case 'low': return '❓';
      default: return '❔';
    }
  }
}