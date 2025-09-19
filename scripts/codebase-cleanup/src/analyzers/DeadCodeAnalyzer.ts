import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { Analyzer, FileInventory, AnalysisResult, Finding, ProgressInfo } from '../types';

/**
 * Information about a symbol (function, variable, class, etc.) in the codebase
 */
interface SymbolInfo {
  name: string;
  filePath: string;
  kind: ts.SyntaxKind;
  isExported: boolean;
  line: number;
  column: number;
  isUsed: boolean;
}

/**
 * Information about import/export relationships
 */
interface ImportExportInfo {
  filePath: string;
  imports: Set<string>; // symbols imported from other files
  exports: Set<string>; // symbols exported by this file
  externalImports: Set<string>; // imports from node_modules
}

/**
 * Analyzer that detects dead code using TypeScript compiler API for AST parsing
 */
export class DeadCodeAnalyzer implements Analyzer {
  readonly name = 'dead-code-analyzer';
  readonly description = 'Identifies unused exports, functions, and variables using TypeScript AST analysis';

  private symbolMap = new Map<string, SymbolInfo>();
  private importExportMap = new Map<string, ImportExportInfo>();
  private usageMap = new Map<string, Set<string>>(); // symbol -> files that use it

  /**
   * Analyze file inventory to find dead code
   */
  async analyze(
    inventory: FileInventory[], 
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<AnalysisResult> {
    const findings: Finding[] = [];
    
    // Filter to only TypeScript/JavaScript files
    const codeFiles = inventory.filter(file => 
      ['typescript', 'javascript'].includes(file.fileType) &&
      !file.path.includes('node_modules') &&
      !file.path.includes('.d.ts') &&
      !file.path.endsWith('.test.ts') &&
      !file.path.endsWith('.test.js') &&
      !file.path.endsWith('.spec.ts') &&
      !file.path.endsWith('.spec.js')
    );

    this.reportProgress(progressCallback, 'Parsing files and building symbol map', 0);
    
    // Phase 1: Parse all files and build symbol map
    await this.buildSymbolMap(codeFiles, progressCallback);
    
    this.reportProgress(progressCallback, 'Analyzing import/export relationships', 33);
    
    // Phase 2: Analyze import/export relationships
    await this.analyzeImportExports(codeFiles, progressCallback);
    
    this.reportProgress(progressCallback, 'Detecting unused symbols', 66);
    
    // Phase 3: Detect unused symbols
    const unusedSymbols = this.detectUnusedSymbols();
    
    // Phase 4: Generate findings
    findings.push(...this.generateFindings(unusedSymbols));
    
    this.reportProgress(progressCallback, 'Dead code analysis complete', 100);
    
    return {
      analyzer: this.name,
      findings,
      confidence: 'medium', // AST analysis is reliable but may miss dynamic usage
      riskLevel: 'review' // Dead code removal should be reviewed
    };
  }

  /**
   * Check if analyzer can run
   */
  async canRun(): Promise<boolean> {
    try {
      // Check if TypeScript is available
      return typeof ts !== 'undefined';
    } catch {
      return false;
    }
  }

  /**
   * Estimate time based on inventory size
   */
  getEstimatedTime(inventorySize: number): number {
    // AST parsing is more expensive - roughly 10ms per file
    return inventorySize * 10;
  }

  /**
   * Build a map of all symbols (functions, variables, classes) in the codebase
   */
  private async buildSymbolMap(
    files: FileInventory[], 
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<void> {
    let processedFiles = 0;
    
    for (const file of files) {
      try {
        const sourceCode = await this.readFileContent(file.path);
        const sourceFile = ts.createSourceFile(
          file.path,
          sourceCode,
          ts.ScriptTarget.Latest,
          true
        );
        
        this.extractSymbols(sourceFile, file.path);
        
        processedFiles++;
        if (processedFiles % 10 === 0) {
          const percentage = Math.round((processedFiles / files.length) * 33);
          this.reportProgress(progressCallback, `Parsed ${processedFiles}/${files.length} files`, percentage);
        }
      } catch (error) {
        // Skip files that can't be parsed
        console.warn(`Failed to parse ${file.path}:`, error);
      }
    }
  }

  /**
   * Extract symbols from a TypeScript source file
   */
  private extractSymbols(sourceFile: ts.SourceFile, filePath: string): void {
    const visit = (node: ts.Node) => {
      const symbolInfo = this.getSymbolInfo(node, sourceFile, filePath);
      if (symbolInfo) {
        const key = `${filePath}:${symbolInfo.name}`;
        this.symbolMap.set(key, symbolInfo);
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
  }

  /**
   * Get symbol information from a TypeScript node
   */
  private getSymbolInfo(node: ts.Node, sourceFile: ts.SourceFile, filePath: string): SymbolInfo | null {
    let name: string | undefined;
    let isExported = false;
    
    // Check for export modifiers
    if (ts.canHaveModifiers(node)) {
      const modifiers = ts.getModifiers(node);
      if (modifiers) {
        isExported = modifiers.some((mod: ts.Modifier) => mod.kind === ts.SyntaxKind.ExportKeyword);
      }
    }
    
    switch (node.kind) {
      case ts.SyntaxKind.FunctionDeclaration:
        const funcDecl = node as ts.FunctionDeclaration;
        name = funcDecl.name?.text;
        break;
        
      case ts.SyntaxKind.VariableDeclaration:
        const varDecl = node as ts.VariableDeclaration;
        if (ts.isIdentifier(varDecl.name)) {
          name = varDecl.name.text;
        }
        break;
        
      case ts.SyntaxKind.ClassDeclaration:
        const classDecl = node as ts.ClassDeclaration;
        name = classDecl.name?.text;
        break;
        
      case ts.SyntaxKind.InterfaceDeclaration:
        const interfaceDecl = node as ts.InterfaceDeclaration;
        name = interfaceDecl.name.text;
        break;
        
      case ts.SyntaxKind.TypeAliasDeclaration:
        const typeDecl = node as ts.TypeAliasDeclaration;
        name = typeDecl.name.text;
        break;
        
      case ts.SyntaxKind.EnumDeclaration:
        const enumDecl = node as ts.EnumDeclaration;
        name = enumDecl.name.text;
        break;
    }
    
    if (!name) return null;
    
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    
    return {
      name,
      filePath,
      kind: node.kind,
      isExported,
      line: line + 1,
      column: character + 1,
      isUsed: false
    };
  }

  /**
   * Analyze import/export relationships across all files
   */
  private async analyzeImportExports(
    files: FileInventory[], 
    progressCallback?: (progress: ProgressInfo) => void
  ): Promise<void> {
    let processedFiles = 0;
    
    for (const file of files) {
      try {
        const sourceCode = await this.readFileContent(file.path);
        const sourceFile = ts.createSourceFile(
          file.path,
          sourceCode,
          ts.ScriptTarget.Latest,
          true
        );
        
        const importExportInfo = this.extractImportExports(sourceFile, file.path);
        this.importExportMap.set(file.path, importExportInfo);
        
        // Track usage based on imports
        this.trackUsageFromImports(importExportInfo);
        
        processedFiles++;
        if (processedFiles % 10 === 0) {
          const percentage = 33 + Math.round((processedFiles / files.length) * 33);
          this.reportProgress(progressCallback, `Analyzed imports/exports in ${processedFiles}/${files.length} files`, percentage);
        }
      } catch (error) {
        console.warn(`Failed to analyze imports/exports in ${file.path}:`, error);
      }
    }
  }

  /**
   * Extract import and export information from a source file
   */
  private extractImportExports(sourceFile: ts.SourceFile, filePath: string): ImportExportInfo {
    const imports = new Set<string>();
    const exports = new Set<string>();
    const externalImports = new Set<string>();
    
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        this.processImportDeclaration(node, imports, externalImports, filePath);
      } else if (ts.isExportDeclaration(node)) {
        this.processExportDeclaration(node, exports);
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    
    return { filePath, imports, exports, externalImports };
  }

  /**
   * Process an import declaration node
   */
  private processImportDeclaration(
    node: ts.ImportDeclaration, 
    imports: Set<string>, 
    externalImports: Set<string>,
    currentFilePath: string
  ): void {
    if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) {
      return;
    }
    
    const moduleSpecifier = node.moduleSpecifier.text;
    
    // Check if it's an external import (from node_modules)
    if (!moduleSpecifier.startsWith('.') && !moduleSpecifier.startsWith('/')) {
      externalImports.add(moduleSpecifier);
      return;
    }
    
    // Process import clause
    if (node.importClause) {
      // Default import
      if (node.importClause.name) {
        imports.add(node.importClause.name.text);
      }
      
      // Named imports
      if (node.importClause.namedBindings) {
        if (ts.isNamedImports(node.importClause.namedBindings)) {
          for (const element of node.importClause.namedBindings.elements) {
            imports.add(element.name.text);
          }
        } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          imports.add(node.importClause.namedBindings.name.text);
        }
      }
    }
  }

  /**
   * Process an export declaration node
   */
  private processExportDeclaration(node: ts.ExportDeclaration, exports: Set<string>): void {
    if (node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) {
        exports.add(element.name.text);
      }
    }
  }

  /**
   * Track symbol usage based on import information
   */
  private trackUsageFromImports(importExportInfo: ImportExportInfo): void {
    for (const importedSymbol of importExportInfo.imports) {
      if (!this.usageMap.has(importedSymbol)) {
        this.usageMap.set(importedSymbol, new Set());
      }
      this.usageMap.get(importedSymbol)!.add(importExportInfo.filePath);
    }
  }

  /**
   * Detect unused symbols by cross-referencing definitions with usage
   */
  private detectUnusedSymbols(): SymbolInfo[] {
    const unusedSymbols: SymbolInfo[] = [];
    
    for (const [key, symbol] of this.symbolMap) {
      // Skip if symbol is used
      if (this.usageMap.has(symbol.name) && this.usageMap.get(symbol.name)!.size > 0) {
        continue;
      }
      
      // Skip certain patterns that are likely to be used dynamically
      if (this.isLikelyDynamicUsage(symbol)) {
        continue;
      }
      
      // For exported symbols, be more conservative
      if (symbol.isExported) {
        // Only flag as unused if we're confident it's not used externally
        if (!this.isLikelyExternalUsage(symbol)) {
          unusedSymbols.push(symbol);
        }
      } else {
        // Non-exported symbols are safer to flag as unused
        unusedSymbols.push(symbol);
      }
    }
    
    return unusedSymbols;
  }

  /**
   * Check if a symbol is likely used dynamically (and thus hard to detect)
   */
  private isLikelyDynamicUsage(symbol: SymbolInfo): boolean {
    // Skip main/entry functions
    if (symbol.name === 'main' || symbol.name === 'index') {
      return true;
    }
    
    // Skip API route handlers (common patterns)
    if (symbol.name.match(/^(get|post|put|delete|patch|head|options)/i)) {
      return true;
    }
    
    // Skip React components (capitalized names)
    if (symbol.name.match(/^[A-Z]/)) {
      return true;
    }
    
    // Skip test-related functions
    if (symbol.name.match(/^(test|describe|it|beforeEach|afterEach|beforeAll|afterAll)$/)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if an exported symbol is likely used externally
   */
  private isLikelyExternalUsage(symbol: SymbolInfo): boolean {
    // If it's in an index file, it's likely re-exported
    if (symbol.filePath.includes('index.')) {
      return true;
    }
    
    // If it's a type definition, it might be used in type annotations
    if (symbol.kind === ts.SyntaxKind.InterfaceDeclaration || 
        symbol.kind === ts.SyntaxKind.TypeAliasDeclaration) {
      return true;
    }
    
    // If it's in a types package, it's likely used externally
    if (symbol.filePath.includes('/types/') || symbol.filePath.includes('packages/types')) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate findings from unused symbols
   */
  private generateFindings(unusedSymbols: SymbolInfo[]): Finding[] {
    const findings: Finding[] = [];
    
    // Group by file for better reporting
    const symbolsByFile = new Map<string, SymbolInfo[]>();
    
    for (const symbol of unusedSymbols) {
      if (!symbolsByFile.has(symbol.filePath)) {
        symbolsByFile.set(symbol.filePath, []);
      }
      symbolsByFile.get(symbol.filePath)!.push(symbol);
    }
    
    for (const [filePath, symbols] of symbolsByFile) {
      const exportedSymbols = symbols.filter(s => s.isExported);
      const internalSymbols = symbols.filter(s => !s.isExported);
      
      if (exportedSymbols.length > 0) {
        findings.push({
          type: 'unused',
          files: [filePath],
          description: `Found ${exportedSymbols.length} unused exported symbol(s): ${exportedSymbols.map(s => s.name).join(', ')}`,
          recommendation: `Review and consider removing unused exports. These symbols are exported but not imported anywhere in the codebase.`,
          autoFixable: false, // Exported symbols need manual review
          estimatedSavings: {
            files: 0 // Removing symbols doesn't remove files
          }
        });
      }
      
      if (internalSymbols.length > 0) {
        findings.push({
          type: 'unused',
          files: [filePath],
          description: `Found ${internalSymbols.length} unused internal symbol(s): ${internalSymbols.map(s => s.name).join(', ')}`,
          recommendation: `Consider removing unused internal functions, variables, and classes. Lines: ${internalSymbols.map(s => s.line).join(', ')}`,
          autoFixable: true, // Internal symbols are safer to auto-remove
          estimatedSavings: {
            files: 0
          }
        });
      }
    }
    
    return findings;
  }

  /**
   * Read file content from disk
   */
  private async readFileContent(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
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