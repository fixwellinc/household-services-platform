/**
 * HTML reporter for detailed web-based reports
 */

import { promises as fs } from 'fs';
import { CleanupReport, Finding, AnalysisResult } from '../types';
import { Reporter, ReportUtils } from './BaseReporter';

/**
 * HTML reporter that generates detailed, interactive web reports
 */
export class HTMLReporter implements Reporter {
  readonly name = 'html';
  readonly fileExtension = 'html';
  
  async canRun(): Promise<boolean> {
    // HTML reporter can always run
    return true;
  }
  
  async generateReport(report: CleanupReport, outputPath?: string): Promise<string> {
    const html = this.createHTMLReport(report);
    
    if (outputPath) {
      await this.writeToFile(html, outputPath);
    }
    
    return html;
  }
  
  private createHTMLReport(report: CleanupReport): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Codebase Cleanup Report</title>
    ${this.getStyles()}
    ${this.getScripts()}
</head>
<body>
    <div class="container">
        ${this.createHeader()}
        ${this.createSummarySection(report)}
        ${this.createChartsSection(report)}
        ${this.createCategoriesSection(report)}
        ${this.createRecommendationsSection(report)}
        ${this.createFooter()}
    </div>
</body>
</html>`;
  }
  
  private getStyles(): string {
    return `<style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f7fa;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header .subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            border-left: 4px solid #667eea;
        }
        
        .summary-card h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.1rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .summary-value {
            font-size: 2rem;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 5px;
        }
        
        .summary-label {
            color: #718096;
            font-size: 0.9rem;
        }
        
        .section {
            background: white;
            margin-bottom: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .section-header {
            background: #f8fafc;
            padding: 20px 25px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .section-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #2d3748;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section-content {
            padding: 25px;
        }
        
        .chart-container {
            height: 300px;
            margin: 20px 0;
        }
        
        .category-item {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 15px;
            overflow: hidden;
        }
        
        .category-header {
            background: #f8fafc;
            padding: 15px 20px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .category-header:hover {
            background: #edf2f7;
        }
        
        .category-name {
            font-weight: 600;
            color: #2d3748;
        }
        
        .category-stats {
            display: flex;
            gap: 15px;
            font-size: 0.9rem;
        }
        
        .stat-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .risk-safe { background: #c6f6d5; color: #22543d; }
        .risk-review { background: #fef5e7; color: #744210; }
        .risk-manual { background: #fed7d7; color: #742a2a; }
        
        .confidence-high { background: #bee3f8; color: #2a4365; }
        .confidence-medium { background: #e6fffa; color: #234e52; }
        .confidence-low { background: #fbb6ce; color: #702459; }
        
        .category-content {
            display: none;
            padding: 20px;
            background: white;
        }
        
        .category-content.active {
            display: block;
        }
        
        .finding-item {
            border-left: 4px solid #e2e8f0;
            padding: 15px;
            margin-bottom: 15px;
            background: #f8fafc;
            border-radius: 0 8px 8px 0;
        }
        
        .finding-duplicate { border-left-color: #3182ce; }
        .finding-unused { border-left-color: #e53e3e; }
        .finding-obsolete { border-left-color: #d69e2e; }
        .finding-inconsistent { border-left-color: #805ad5; }
        
        .finding-header {
            display: flex;
            justify-content: between;
            align-items: flex-start;
            margin-bottom: 10px;
        }
        
        .finding-title {
            font-weight: 600;
            color: #2d3748;
            flex: 1;
        }
        
        .finding-type {
            font-size: 1.2rem;
            margin-right: 10px;
        }
        
        .finding-description {
            color: #4a5568;
            margin-bottom: 10px;
        }
        
        .finding-recommendation {
            background: white;
            padding: 10px;
            border-radius: 6px;
            border-left: 3px solid #48bb78;
            font-style: italic;
            color: #2f855a;
        }
        
        .finding-files {
            margin-top: 10px;
        }
        
        .file-list {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            max-height: 150px;
            overflow-y: auto;
        }
        
        .file-item {
            padding: 8px 12px;
            border-bottom: 1px solid #f1f5f9;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.85rem;
            color: #4a5568;
        }
        
        .file-item:last-child {
            border-bottom: none;
        }
        
        .savings-info {
            display: flex;
            gap: 15px;
            margin-top: 10px;
            font-size: 0.9rem;
        }
        
        .savings-item {
            background: #e6fffa;
            color: #234e52;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 500;
        }
        
        .auto-fix-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .auto-fix-yes {
            background: #c6f6d5;
            color: #22543d;
        }
        
        .auto-fix-no {
            background: #fed7d7;
            color: #742a2a;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            color: #718096;
            font-size: 0.9rem;
        }
        
        .toggle-icon {
            transition: transform 0.2s;
        }
        
        .toggle-icon.rotated {
            transform: rotate(180deg);
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .summary-grid {
                grid-template-columns: 1fr;
            }
            
            .category-stats {
                flex-direction: column;
                gap: 5px;
            }
        }
    </style>`;
  }
  
  private getScripts(): string {
    return `<script>
        document.addEventListener('DOMContentLoaded', function() {
            // Toggle category sections
            document.querySelectorAll('.category-header').forEach(header => {
                header.addEventListener('click', function() {
                    const content = this.nextElementSibling;
                    const icon = this.querySelector('.toggle-icon');
                    
                    content.classList.toggle('active');
                    icon.classList.toggle('rotated');
                });
            });
            
            // Create charts if Chart.js is available
            if (typeof Chart !== 'undefined') {
                createCharts();
            }
        });
        
        function createCharts() {
            // This would create interactive charts using Chart.js
            // For now, we'll just add placeholder functionality
            console.log('Charts would be created here with Chart.js');
        }
        
        function filterFindings(type) {
            const findings = document.querySelectorAll('.finding-item');
            findings.forEach(finding => {
                if (type === 'all' || finding.classList.contains('finding-' + type)) {
                    finding.style.display = 'block';
                } else {
                    finding.style.display = 'none';
                }
            });
        }
    </script>`;
  }
  
  private createHeader(): string {
    const timestamp = new Date().toLocaleString();
    return `
        <div class="header">
            <h1>🧹 Codebase Cleanup Report</h1>
            <div class="subtitle">Generated on ${timestamp}</div>
        </div>
    `;
  }
  
  private createSummarySection(report: CleanupReport): string {
    const { summary } = report;
    
    return `
        <div class="summary-grid">
            <div class="summary-card">
                <h3>📁 Files Analyzed</h3>
                <div class="summary-value">${summary.totalFiles.toLocaleString()}</div>
                <div class="summary-label">Total files scanned</div>
            </div>
            
            <div class="summary-card">
                <h3>🔍 Issues Found</h3>
                <div class="summary-value">${summary.totalFindings.toLocaleString()}</div>
                <div class="summary-label">Cleanup opportunities</div>
            </div>
            
            <div class="summary-card">
                <h3>🗑️ Files to Remove</h3>
                <div class="summary-value">${summary.estimatedSavings.files.toLocaleString()}</div>
                <div class="summary-label">Potential file cleanup</div>
            </div>
            
            <div class="summary-card">
                <h3>💾 Disk Space</h3>
                <div class="summary-value">${summary.estimatedSavings.diskSpace}</div>
                <div class="summary-label">Potential space savings</div>
            </div>
            
            <div class="summary-card">
                <h3>📦 Dependencies</h3>
                <div class="summary-value">${summary.estimatedSavings.dependencies.toLocaleString()}</div>
                <div class="summary-label">Unused dependencies</div>
            </div>
        </div>
    `;
  }
  
  private createChartsSection(report: CleanupReport): string {
    // Placeholder for charts - in a real implementation, this would include Chart.js integration
    return `
        <div class="section">
            <div class="section-header">
                <div class="section-title">📊 Analysis Overview</div>
            </div>
            <div class="section-content">
                <div class="chart-container">
                    <p style="text-align: center; color: #718096; padding: 50px;">
                        📈 Interactive charts would be displayed here<br>
                        <small>Showing findings by type, risk level, and workspace distribution</small>
                    </p>
                </div>
            </div>
        </div>
    `;
  }
  
  private createCategoriesSection(report: CleanupReport): string {
    const categoriesHTML = Object.entries(report.categories)
      .map(([name, result]) => this.createCategoryItem(name, result))
      .join('');
    
    return `
        <div class="section">
            <div class="section-header">
                <div class="section-title">🔍 Analysis Categories</div>
            </div>
            <div class="section-content">
                ${categoriesHTML}
            </div>
        </div>
    `;
  }
  
  private createCategoryItem(name: string, result: AnalysisResult): string {
    const findingsHTML = result.findings
      .map(finding => this.createFindingItem(finding))
      .join('');
    
    return `
        <div class="category-item">
            <div class="category-header">
                <div class="category-name">${name}</div>
                <div class="category-stats">
                    <span class="stat-badge risk-${result.riskLevel}">Risk: ${result.riskLevel}</span>
                    <span class="stat-badge confidence-${result.confidence}">Confidence: ${result.confidence}</span>
                    <span>${result.findings.length} finding${result.findings.length !== 1 ? 's' : ''}</span>
                    <span class="toggle-icon">▼</span>
                </div>
            </div>
            <div class="category-content">
                ${findingsHTML || '<p style="color: #718096; font-style: italic;">No issues found in this category.</p>'}
            </div>
        </div>
    `;
  }
  
  private createFindingItem(finding: Finding): string {
    const typeIcon = ReportUtils.getTypeIcon(finding.type);
    const filesHTML = finding.files.length > 0 ? `
        <div class="finding-files">
            <strong>Affected files:</strong>
            <div class="file-list">
                ${finding.files.map(file => `<div class="file-item">${this.escapeHtml(file)}</div>`).join('')}
            </div>
        </div>
    ` : '';
    
    const savingsHTML = finding.estimatedSavings ? this.createSavingsInfo(finding.estimatedSavings) : '';
    
    return `
        <div class="finding-item finding-${finding.type}">
            <div class="finding-header">
                <div class="finding-type">${typeIcon}</div>
                <div class="finding-title">${this.escapeHtml(finding.description)}</div>
                <div class="auto-fix-badge auto-fix-${finding.autoFixable ? 'yes' : 'no'}">
                    ${finding.autoFixable ? '🔧 Auto-fix' : '👤 Manual'}
                </div>
            </div>
            
            <div class="finding-recommendation">
                💡 ${this.escapeHtml(finding.recommendation)}
            </div>
            
            ${savingsHTML}
            ${filesHTML}
        </div>
    `;
  }
  
  private createSavingsInfo(savings: NonNullable<Finding['estimatedSavings']>): string {
    const items = [];
    
    if (savings.files) {
      items.push(`<span class="savings-item">📁 ${savings.files} files</span>`);
    }
    
    if (savings.size) {
      items.push(`<span class="savings-item">💾 ${ReportUtils.formatFileSize(savings.size)}</span>`);
    }
    
    if (savings.dependencies) {
      items.push(`<span class="savings-item">📦 ${savings.dependencies} deps</span>`);
    }
    
    if (items.length === 0) return '';
    
    return `
        <div class="savings-info">
            <strong>Estimated savings:</strong>
            ${items.join('')}
        </div>
    `;
  }
  
  private createRecommendationsSection(report: CleanupReport): string {
    const sortedFindings = ReportUtils.sortFindingsByPriority(report.recommendations);
    const topFindings = sortedFindings.slice(0, 20); // Show top 20
    
    const findingsHTML = topFindings
      .map(finding => this.createFindingItem(finding))
      .join('');
    
    return `
        <div class="section">
            <div class="section-header">
                <div class="section-title">🎯 Top Recommendations</div>
            </div>
            <div class="section-content">
                ${findingsHTML || '<p style="color: #718096; font-style: italic;">No recommendations available.</p>'}
                ${sortedFindings.length > 20 ? `<p style="text-align: center; color: #718096; margin-top: 20px;">... and ${sortedFindings.length - 20} more recommendations</p>` : ''}
            </div>
        </div>
    `;
  }
  
  private createFooter(): string {
    return `
        <div class="footer">
            <p>Generated by Codebase Cleanup Tool</p>
            <p>For more information, visit the project documentation</p>
        </div>
    `;
  }
  
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  private async writeToFile(content: string, filePath: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write HTML report to ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}