export { FileScanner } from './FileScanner';
export { AnalysisOrchestrator } from './AnalysisOrchestrator';
export { ChangeExecutor } from './ChangeExecutor';
export { MockAnalyzer } from './MockAnalyzer';
export { SafetyManager } from './SafetyManager';
export type { SafetyConfig, SafetyCheckResult } from './SafetyManager';
export type { 
  FileInventory, 
  ProgressInfo, 
  Analyzer, 
  AnalysisResult, 
  AnalyzerError, 
  OrchestrationResult,
  Change,
  ChangeResult,
  BackupInfo,
  ExecutionPlan,
  ExecutionResult,
  ExecutionOptions,
  ChangeType
} from '../types';