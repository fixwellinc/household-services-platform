import { Analyzer, FileInventory, AnalysisResult, Finding, ProgressInfo } from '../types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration file types that the analyzer recognizes
 */
type ConfigType = 
  | 'env' 
  | 'tsconfig' 
  | 'package' 
  | 'eslint' 
  | 'prettier' 
  | 'jest' 
  | 'vite' 
  | 'webpack' 
  | 'babel'
  | 'other';

/**
 * Represents a parsed configuration file
 */
interface ConfigFile {
  path: string;
  type: ConfigType;
  content: any;
  environment?: string; // For env files: development, production, test, etc.
  workspace: string;
  size: number;
}

/**
 * Represents a configuration setting with its value and location
 */
interface ConfigSetting {
  key: string;
  value: any;
  file: string;
  line?: number;
}

/**
 * Analyzer that identifies duplicate configuration files and conflicting settings
 */
export class ConfigurationAnalyzer implements Analyzer {
  readonly name = 'configuration-analyzer';
  readonly description = 'Identifies duplicate configuration files and conflicting settings across environments';

  /**
   * Analyze configuration files for duplicates and conflicts
   */
  async analyze(
    inventory: FileInventory[], 
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<AnalysisResult> {
    const findings: Finding[] = [];
    
    this.reportProgress(progressCallback, 'Identifying configuration files', 0);
    
    // Filter and categorize configuration files
    const configFiles = await this.identifyConfigFiles(inventory);
    
    this.reportProgress(progressCallback, 'Analyzing duplicate configurations', 25);
    
    // Find duplicate configuration files
    const duplicateFindings = this.findDuplicateConfigs(configFiles);
    findings.push(...duplicateFindings);
    
    this.reportProgress(progressCallback, 'Detecting conflicting settings', 50);
    
    // Find conflicting settings across environments
    const conflictFindings = await this.findConflictingSettings(configFiles);
    findings.push(...conflictFindings);
    
    this.reportProgress(progressCallback, 'Identifying consolidation opportunities', 75);
    
    // Find consolidation opportunities
    const consolidationFindings = this.findConsolidationOpportunities(configFiles);
    findings.push(...consolidationFindings);
    
    this.reportProgress(progressCallback, 'Analysis complete', 100);
    
    return {
      analyzer: this.name,
      findings,
      confidence: 'high',
      riskLevel: 'review' // Configuration changes need careful review
    };
  }

  /**
   * Check if analyzer can run
   */
  async canRun(): Promise<boolean> {
    return true;
  }

  /**
   * Estimate time based on inventory size
   */
  getEstimatedTime(inventorySize: number): number {
    // Configuration analysis is relatively fast, mainly I/O bound
    return Math.max(1000, inventorySize * 0.5);
  }

  /**
   * Identify and categorize configuration files from inventory
   */
  private async identifyConfigFiles(inventory: FileInventory[]): Promise<ConfigFile[]> {
    const configFiles: ConfigFile[] = [];
    
    for (const file of inventory) {
      const configType = this.getConfigType(file.path);
      if (configType !== 'other') {
        try {
          const content = await this.parseConfigFile(file.path, configType);
          const environment = this.extractEnvironment(file.path, configType);
          
          configFiles.push({
            path: file.path,
            type: configType,
            content,
            environment,
            workspace: file.workspace,
            size: file.size
          });
        } catch (error) {
          // Skip files that can't be parsed
          console.warn(`Could not parse config file ${file.path}:`, error);
        }
      }
    }
    
    return configFiles;
  }

  /**
   * Determine the configuration type based on file path
   */
  private getConfigType(filePath: string): ConfigType {
    const fileName = path.basename(filePath);
    const dirName = path.dirname(filePath);
    
    // Environment files
    if (fileName.startsWith('.env') || fileName.endsWith('.env') || fileName.includes('.env.')) {
      return 'env';
    }
    
    // TypeScript configuration
    if (fileName === 'tsconfig.json' || fileName.startsWith('tsconfig.')) {
      return 'tsconfig';
    }
    
    // Package configuration
    if (fileName === 'package.json') {
      return 'package';
    }
    
    // ESLint configuration
    if (fileName.startsWith('.eslintrc') || fileName === 'eslint.config.js') {
      return 'eslint';
    }
    
    // Prettier configuration
    if (fileName.startsWith('.prettierrc') || fileName === 'prettier.config.js') {
      return 'prettier';
    }
    
    // Jest configuration
    if (fileName.startsWith('jest.config') || fileName === 'jest.json') {
      return 'jest';
    }
    
    // Vite configuration
    if (fileName.startsWith('vite.config')) {
      return 'vite';
    }
    
    // Webpack configuration
    if (fileName.startsWith('webpack.config')) {
      return 'webpack';
    }
    
    // Babel configuration
    if (fileName.startsWith('.babelrc') || fileName.startsWith('babel.config')) {
      return 'babel';
    }
    
    return 'other';
  }

  /**
   * Extract environment information from file path
   */
  private extractEnvironment(filePath: string, configType: ConfigType): string | undefined {
    if (configType !== 'env') return undefined;
    
    const fileName = path.basename(filePath);
    
    // Extract environment from filename patterns
    if (fileName.includes('.development')) return 'development';
    if (fileName.includes('.production')) return 'production';
    if (fileName.includes('.test')) return 'test';
    if (fileName.includes('.staging')) return 'staging';
    if (fileName.includes('.local')) return 'local';
    
    // Check directory structure for environment hints
    if (filePath.includes('/config/')) {
      if (filePath.includes('production')) return 'production';
      if (filePath.includes('development')) return 'development';
      if (filePath.includes('test')) return 'test';
    }
    
    // Default environment files (including .env, .env.backup, etc.)
    if (fileName === '.env' || fileName.startsWith('.env.') && 
        !fileName.includes('.development') && !fileName.includes('.production') && 
        !fileName.includes('.test') && !fileName.includes('.staging') && 
        !fileName.includes('.local')) {
      return 'default';
    }
    
    // If it's an env file but doesn't match specific patterns, treat as default
    return 'default';
  }

  /**
   * Parse configuration file content based on type
   */
  private async parseConfigFile(filePath: string, configType: ConfigType): Promise<any> {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    switch (configType) {
      case 'env':
        return this.parseEnvFile(content);
      
      case 'tsconfig':
      case 'package':
        return JSON.parse(content);
      
      case 'eslint':
      case 'prettier':
      case 'jest':
      case 'vite':
      case 'webpack':
      case 'babel':
        if (filePath.endsWith('.json')) {
          return JSON.parse(content);
        } else {
          // For JS config files, we'd need to evaluate them
          // For now, return raw content
          return { _rawContent: content };
        }
      
      default:
        return { _rawContent: content };
    }
  }

  /**
   * Parse .env file content into key-value pairs
   */
  private parseEnvFile(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // Parse key=value pairs
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        let value = trimmed.substring(equalIndex + 1).trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Find duplicate configuration files
   */
  private findDuplicateConfigs(configFiles: ConfigFile[]): Finding[] {
    const findings: Finding[] = [];
    
    // Group by configuration type and workspace
    const typeGroups: Record<string, ConfigFile[]> = {};
    
    for (const config of configFiles) {
      const key = `${config.type}-${config.workspace}`;
      if (!typeGroups[key]) {
        typeGroups[key] = [];
      }
      typeGroups[key].push(config);
    }
    
    // Find duplicates within each group
    for (const [groupKey, configs] of Object.entries(typeGroups)) {
      if (configs.length > 1) {
        const [configType, workspace] = groupKey.split('-');
        
        // For env files, group by environment
        if (configType === 'env') {
          const envGroups: Record<string, ConfigFile[]> = {};
          for (const config of configs) {
            const envKey = config.environment || 'default';
            if (!envGroups[envKey]) {
              envGroups[envKey] = [];
            }
            envGroups[envKey].push(config);
          }
          
          for (const [env, envConfigs] of Object.entries(envGroups)) {
            if (envConfigs.length > 1) {
              findings.push({
                type: 'duplicate',
                files: envConfigs.map(c => c.path),
                description: `Multiple ${env} environment files found in ${workspace} workspace`,
                recommendation: `Consolidate into a single ${env} environment file. Consider keeping the most comprehensive one and removing others.`,
                autoFixable: false,
                estimatedSavings: {
                  files: envConfigs.length - 1,
                  size: envConfigs.slice(1).reduce((sum, c) => sum + c.size, 0)
                }
              });
            }
          }
        } else {
          // For other config types, direct duplicates
          findings.push({
            type: 'duplicate',
            files: configs.map(c => c.path),
            description: `Multiple ${configType} configuration files found in ${workspace} workspace`,
            recommendation: `Keep the most appropriate ${configType} file and remove duplicates. Consider workspace-specific needs.`,
            autoFixable: false,
            estimatedSavings: {
              files: configs.length - 1,
              size: configs.slice(1).reduce((sum, c) => sum + c.size, 0)
            }
          });
        }
      }
    }
    
    return findings;
  }

  /**
   * Find conflicting settings across configuration files
   */
  private async findConflictingSettings(configFiles: ConfigFile[]): Promise<Finding[]> {
    const findings: Finding[] = [];
    
    // Group environment files by workspace to check for conflicts
    const envFilesByWorkspace: Record<string, ConfigFile[]> = {};
    
    for (const config of configFiles) {
      if (config.type === 'env') {
        if (!envFilesByWorkspace[config.workspace]) {
          envFilesByWorkspace[config.workspace] = [];
        }
        envFilesByWorkspace[config.workspace].push(config);
      }
    }
    
    // Check for conflicts within each workspace
    for (const [workspace, envFiles] of Object.entries(envFilesByWorkspace)) {
      const conflicts = this.findEnvConflicts(envFiles);
      findings.push(...conflicts);
    }
    
    // Check for TypeScript configuration conflicts
    const tsconfigConflicts = this.findTsconfigConflicts(
      configFiles.filter(c => c.type === 'tsconfig')
    );
    findings.push(...tsconfigConflicts);
    
    return findings;
  }

  /**
   * Find conflicts in environment files
   */
  private findEnvConflicts(envFiles: ConfigFile[]): Finding[] {
    const findings: Finding[] = [];
    
    if (envFiles.length < 2) return findings;
    
    // Collect all settings across files
    const settingsByKey: Record<string, ConfigSetting[]> = {};
    
    for (const envFile of envFiles) {
      if (typeof envFile.content === 'object') {
        for (const [key, value] of Object.entries(envFile.content)) {
          if (!settingsByKey[key]) {
            settingsByKey[key] = [];
          }
          settingsByKey[key].push({
            key,
            value,
            file: envFile.path
          });
        }
      }
    }
    
    // Find conflicting values
    for (const [key, settings] of Object.entries(settingsByKey)) {
      if (settings.length > 1) {
        const uniqueValues = new Set(settings.map(s => s.value));
        
        if (uniqueValues.size > 1) {
          // Found conflicting values
          const conflictDescription = settings
            .map(s => `${path.basename(s.file)}: ${s.value}`)
            .join(', ');
          
          findings.push({
            type: 'inconsistent',
            files: settings.map(s => s.file),
            description: `Conflicting values for '${key}': ${conflictDescription}`,
            recommendation: `Review and standardize the value for '${key}' across environment files. Consider which environment should have which value.`,
            autoFixable: false
          });
        }
      }
    }
    
    return findings;
  }

  /**
   * Find conflicts in TypeScript configuration files
   */
  private findTsconfigConflicts(tsconfigFiles: ConfigFile[]): Finding[] {
    const findings: Finding[] = [];
    
    if (tsconfigFiles.length < 2) return findings;
    
    // Check for conflicting compiler options
    const compilerOptionsByWorkspace: Record<string, any> = {};
    
    for (const tsconfig of tsconfigFiles) {
      if (tsconfig.content?.compilerOptions) {
        compilerOptionsByWorkspace[tsconfig.workspace] = {
          file: tsconfig.path,
          options: tsconfig.content.compilerOptions
        };
      }
    }
    
    // Compare key compiler options across workspaces
    const criticalOptions = ['target', 'module', 'moduleResolution', 'strict', 'esModuleInterop'];
    
    const workspaces = Object.keys(compilerOptionsByWorkspace);
    for (let i = 0; i < workspaces.length - 1; i++) {
      for (let j = i + 1; j < workspaces.length; j++) {
        const workspace1 = workspaces[i];
        const workspace2 = workspaces[j];
        
        const config1 = compilerOptionsByWorkspace[workspace1];
        const config2 = compilerOptionsByWorkspace[workspace2];
        
        const conflicts: string[] = [];
        
        for (const option of criticalOptions) {
          const value1 = config1.options[option];
          const value2 = config2.options[option];
          
          if (value1 !== undefined && value2 !== undefined && value1 !== value2) {
            conflicts.push(`${option}: ${workspace1}=${value1}, ${workspace2}=${value2}`);
          }
        }
        
        if (conflicts.length > 0) {
          findings.push({
            type: 'inconsistent',
            files: [config1.file, config2.file],
            description: `Conflicting TypeScript compiler options between ${workspace1} and ${workspace2}: ${conflicts.join('; ')}`,
            recommendation: `Standardize TypeScript compiler options across workspaces or document the reasons for differences. Consider using a shared base configuration.`,
            autoFixable: false
          });
        }
      }
    }
    
    return findings;
  }

  /**
   * Find opportunities for configuration consolidation
   */
  private findConsolidationOpportunities(configFiles: ConfigFile[]): Finding[] {
    const findings: Finding[] = [];
    
    // Look for scattered environment files that could be consolidated
    const envFiles = configFiles.filter(c => c.type === 'env');
    const rootEnvFiles = envFiles.filter(c => c.workspace === 'root');
    const workspaceEnvFiles = envFiles.filter(c => c.workspace !== 'root');
    
    if (rootEnvFiles.length > 0 && workspaceEnvFiles.length > 0) {
      // Check if workspace env files duplicate root settings
      const duplicatedSettings = this.findDuplicatedEnvSettings(rootEnvFiles, workspaceEnvFiles);
      
      if (duplicatedSettings.length > 0) {
        findings.push({
          type: 'inconsistent',
          files: [...rootEnvFiles.map(f => f.path), ...workspaceEnvFiles.map(f => f.path)],
          description: `Environment variables are duplicated across root and workspace files: ${duplicatedSettings.join(', ')}`,
          recommendation: `Consider consolidating environment variables. Move shared settings to root .env file and keep workspace-specific settings in workspace files.`,
          autoFixable: false,
          estimatedSavings: {
            files: Math.floor(workspaceEnvFiles.length / 2) // Potential file reduction
          }
        });
      }
    }
    
    // Look for TypeScript configuration that could use extends
    const tsconfigFiles = configFiles.filter(c => c.type === 'tsconfig');
    if (tsconfigFiles.length > 2) {
      const consolidationOpportunity = this.analyzeTsconfigConsolidation(tsconfigFiles);
      if (consolidationOpportunity) {
        findings.push(consolidationOpportunity);
      }
    }
    
    return findings;
  }

  /**
   * Find duplicated environment settings between root and workspace files
   */
  private findDuplicatedEnvSettings(rootFiles: ConfigFile[], workspaceFiles: ConfigFile[]): string[] {
    const rootSettings = new Set<string>();
    
    // Collect all keys from root files
    for (const rootFile of rootFiles) {
      if (typeof rootFile.content === 'object') {
        Object.keys(rootFile.content).forEach(key => rootSettings.add(key));
      }
    }
    
    // Find duplicated keys in workspace files
    const duplicatedKeys = new Set<string>();
    
    for (const workspaceFile of workspaceFiles) {
      if (typeof workspaceFile.content === 'object') {
        for (const key of Object.keys(workspaceFile.content)) {
          if (rootSettings.has(key)) {
            duplicatedKeys.add(key);
          }
        }
      }
    }
    
    return Array.from(duplicatedKeys);
  }

  /**
   * Analyze TypeScript configuration consolidation opportunities
   */
  private analyzeTsconfigConsolidation(tsconfigFiles: ConfigFile[]): Finding | null {
    // Look for common compiler options that could be extracted to a base config
    const commonOptions: Record<string, any> = {};
    const optionCounts: Record<string, number> = {};
    
    for (const tsconfig of tsconfigFiles) {
      if (tsconfig.content?.compilerOptions) {
        for (const [option, value] of Object.entries(tsconfig.content.compilerOptions)) {
          const key = `${option}:${JSON.stringify(value)}`;
          optionCounts[key] = (optionCounts[key] || 0) + 1;
          
          if (optionCounts[key] === 1) {
            commonOptions[key] = { option, value, count: 1 };
          } else {
            commonOptions[key].count = optionCounts[key];
          }
        }
      }
    }
    
    // Find options that appear in most files (consolidation candidates)
    const threshold = Math.ceil(tsconfigFiles.length * 0.6); // 60% threshold
    const consolidationCandidates = Object.values(commonOptions)
      .filter((item: any) => item.count >= threshold)
      .map((item: any) => item.option);
    
    if (consolidationCandidates.length >= 3) {
      return {
        type: 'inconsistent',
        files: tsconfigFiles.map(f => f.path),
        description: `Multiple TypeScript configurations share common options: ${consolidationCandidates.join(', ')}`,
        recommendation: `Consider creating a base tsconfig.json with shared options and use "extends" in workspace-specific configurations to reduce duplication.`,
        autoFixable: false,
        estimatedSavings: {
          files: 0, // No files removed, but reduced complexity
        }
      };
    }
    
    return null;
  }

  /**
   * Report progress if callback is provided
   */
  private reportProgress(
    callback: ((progress: ProgressInfo) => void) | undefined,
    step: string,
    percentage: number
  ): void {
    if (callback) {
      callback({
        currentStep: step,
        completedSteps: percentage,
        totalSteps: 100,
        percentage,
        details: `${this.name}: ${step}`
      });
    }
  }
}