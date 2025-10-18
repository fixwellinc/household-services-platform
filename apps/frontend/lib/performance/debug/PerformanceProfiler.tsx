/**
 * PerformanceProfiler - Detailed component performance profiling
 * 
 * Provides detailed analysis of component render performance,
 * memory usage, and optimization recommendations.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePerformanceContext } from '../components/PerformanceProvider';
import { RenderMetrics } from '../hooks/useRenderTracking';

interface ProfilerProps {
  autoProfile?: boolean;
  profilingDuration?: number; // seconds
  onProfilingComplete?: (results: ProfilingResults) => void;
}

interface ComponentProfile {
  name: string;
  metrics: RenderMetrics;
  issues: string[];
  recommendations: string[];
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

interface ProfilingResults {
  duration: number;
  totalComponents: number;
  slowComponents: ComponentProfile[];
  fastComponents: ComponentProfile[];
  overallScore: number;
  recommendations: string[];
}

export function PerformanceProfiler({ 
  autoProfile = false, 
  profilingDuration = 10,
  onProfilingComplete 
}: ProfilerProps) {
  const { componentMetrics, refreshMetrics } = usePerformanceContext();
  const [isProfiling, setIsProfiling] = useState(false);
  const [profilingProgress, setProfilingProgress] = useState(0);
  const [results, setResults] = useState<ProfilingResults | null>(null);
  const [sortBy, setSortBy] = useState<'renderTime' | 'renderCount' | 'score'>('renderTime');
  const [filterBy, setFilterBy] = useState<'all' | 'slow' | 'fast'>('all');

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Auto-start profiling
  useEffect(() => {
    if (autoProfile && !isProfiling && !results) {
      startProfiling();
    }
  }, [autoProfile]);

  const startProfiling = useCallback(() => {
    setIsProfiling(true);
    setProfilingProgress(0);
    setResults(null);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / (profilingDuration * 1000)) * 100, 100);
      setProfilingProgress(progress);

      // Refresh metrics during profiling
      refreshMetrics();

      if (progress >= 100) {
        clearInterval(interval);
        completeProfiling();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [profilingDuration, refreshMetrics]);

  const completeProfiling = useCallback(() => {
    setIsProfiling(false);
    setProfilingProgress(100);

    // Analyze component metrics
    const profiles: ComponentProfile[] = Array.from(componentMetrics.entries()).map(([name, metrics]) => {
      const profile = analyzeComponent(name, metrics);
      return profile;
    });

    // Sort by render time (slowest first)
    profiles.sort((a, b) => b.metrics.averageRenderTime - a.metrics.averageRenderTime);

    const slowComponents = profiles.filter(p => p.grade === 'D' || p.grade === 'F');
    const fastComponents = profiles.filter(p => p.grade === 'A' || p.grade === 'B');
    const overallScore = profiles.length > 0 ? 
      profiles.reduce((sum, p) => sum + p.score, 0) / profiles.length : 0;

    const profilingResults: ProfilingResults = {
      duration: profilingDuration,
      totalComponents: profiles.length,
      slowComponents,
      fastComponents,
      overallScore,
      recommendations: generateOverallRecommendations(profiles),
    };

    setResults(profilingResults);
    onProfilingComplete?.(profilingResults);
  }, [componentMetrics, profilingDuration, onProfilingComplete]);

  const analyzeComponent = (name: string, metrics: RenderMetrics): ComponentProfile => {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Analyze render time
    if (metrics.averageRenderTime > 33) {
      issues.push(`Very slow render time (${metrics.averageRenderTime.toFixed(2)}ms avg)`);
      recommendations.push('Consider breaking down into smaller components');
      recommendations.push('Use React.memo() for expensive components');
    } else if (metrics.averageRenderTime > 16) {
      issues.push(`Slow render time (${metrics.averageRenderTime.toFixed(2)}ms avg)`);
      recommendations.push('Consider optimizing render logic');
    }

    // Analyze render frequency
    if (metrics.renderCount > 100) {
      issues.push(`High render frequency (${metrics.renderCount} renders)`);
      recommendations.push('Check for unnecessary re-renders');
      recommendations.push('Use useMemo() and useCallback() for expensive operations');
    }

    // Analyze memory usage
    if (metrics.memoryUsage && metrics.memoryUsage > 50) {
      issues.push(`High memory usage (${metrics.memoryUsage}MB)`);
      recommendations.push('Check for memory leaks');
      recommendations.push('Optimize data structures and cleanup effects');
    }

    // Calculate score and grade
    let score = 100;
    if (metrics.averageRenderTime > 16) score -= 30;
    if (metrics.averageRenderTime > 33) score -= 40;
    if (metrics.renderCount > 100) score -= 20;
    if (metrics.memoryUsage && metrics.memoryUsage > 50) score -= 10;

    score = Math.max(0, score);

    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return {
      name,
      metrics,
      issues,
      recommendations,
      score,
      grade,
    };
  };

  const generateOverallRecommendations = (profiles: ComponentProfile[]): string[] => {
    const recommendations: string[] = [];
    const slowComponents = profiles.filter(p => p.metrics.averageRenderTime > 16);
    const highRenderComponents = profiles.filter(p => p.metrics.renderCount > 100);

    if (slowComponents.length > 0) {
      recommendations.push(`${slowComponents.length} components have slow render times`);
      recommendations.push('Focus on optimizing the slowest components first');
    }

    if (highRenderComponents.length > 0) {
      recommendations.push(`${highRenderComponents.length} components render frequently`);
      recommendations.push('Implement memoization strategies to reduce re-renders');
    }

    if (profiles.length > 20) {
      recommendations.push('Consider component lazy loading for better performance');
    }

    return recommendations;
  };

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A': return 'text-green-500';
      case 'B': return 'text-blue-500';
      case 'C': return 'text-yellow-500';
      case 'D': return 'text-orange-500';
      case 'F': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSortedAndFilteredProfiles = (): ComponentProfile[] => {
    if (!results) return [];

    let profiles = [...results.slowComponents, ...results.fastComponents];

    // Filter
    if (filterBy === 'slow') {
      profiles = profiles.filter(p => p.grade === 'D' || p.grade === 'F');
    } else if (filterBy === 'fast') {
      profiles = profiles.filter(p => p.grade === 'A' || p.grade === 'B');
    }

    // Sort
    profiles.sort((a, b) => {
      switch (sortBy) {
        case 'renderTime':
          return b.metrics.averageRenderTime - a.metrics.averageRenderTime;
        case 'renderCount':
          return b.metrics.renderCount - a.metrics.renderCount;
        case 'score':
          return b.score - a.score;
        default:
          return 0;
      }
    });

    return profiles;
  };

  return (
    <div className="bg-gray-900 text-white rounded-lg p-4 font-mono">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span>🔬</span>
          Performance Profiler
        </h3>
        <div className="flex items-center gap-2">
          {!isProfiling && !results && (
            <button
              onClick={startProfiling}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              Start Profiling
            </button>
          )}
          {results && (
            <button
              onClick={() => {
                setResults(null);
                startProfiling();
              }}
              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
            >
              Re-profile
            </button>
          )}
        </div>
      </div>

      {isProfiling && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span>Profiling components...</span>
            <span>{profilingProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-100"
              style={{ width: `${profilingProgress}%` }}
            />
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-gray-800 rounded p-3">
            <h4 className="font-semibold mb-2">Profiling Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Duration:</div>
                <div>{results.duration}s</div>
              </div>
              <div>
                <div className="text-gray-400">Components:</div>
                <div>{results.totalComponents}</div>
              </div>
              <div>
                <div className="text-gray-400">Overall Score:</div>
                <div className={getGradeColor(results.overallScore >= 90 ? 'A' : results.overallScore >= 80 ? 'B' : results.overallScore >= 70 ? 'C' : results.overallScore >= 60 ? 'D' : 'F')}>
                  {results.overallScore.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Slow Components:</div>
                <div className="text-red-400">{results.slowComponents.length}</div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {results.recommendations.length > 0 && (
            <div className="bg-gray-800 rounded p-3">
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <ul className="text-sm space-y-1">
                {results.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
              >
                <option value="renderTime">Render Time</option>
                <option value="renderCount">Render Count</option>
                <option value="score">Score</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span>Filter:</span>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
              >
                <option value="all">All Components</option>
                <option value="slow">Slow Components</option>
                <option value="fast">Fast Components</option>
              </select>
            </div>
          </div>

          {/* Component List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {getSortedAndFilteredProfiles().map((profile, index) => (
              <div key={profile.name} className="bg-gray-800 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">#{index + 1}</span>
                    <span className="font-medium truncate max-w-64">{profile.name}</span>
                    <span className={`text-lg ${getGradeColor(profile.grade)}`}>
                      {profile.grade}
                    </span>
                    <span className="text-gray-400">({profile.score})</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs mb-2">
                  <div>
                    <div className="text-gray-400">Avg Render:</div>
                    <div className={profile.metrics.averageRenderTime > 16 ? 'text-red-400' : 'text-green-400'}>
                      {profile.metrics.averageRenderTime.toFixed(2)}ms
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Renders:</div>
                    <div>{profile.metrics.renderCount}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Max Render:</div>
                    <div>{profile.metrics.slowestRenderTime.toFixed(2)}ms</div>
                  </div>
                </div>

                {profile.issues.length > 0 && (
                  <div className="mb-2">
                    <div className="text-red-400 text-xs font-semibold mb-1">Issues:</div>
                    <ul className="text-xs space-y-1">
                      {profile.issues.map((issue, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-red-400">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {profile.recommendations.length > 0 && (
                  <div>
                    <div className="text-blue-400 text-xs font-semibold mb-1">Recommendations:</div>
                    <ul className="text-xs space-y-1">
                      {profile.recommendations.slice(0, 2).map((rec, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-blue-400">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isProfiling && !results && (
        <div className="text-center text-gray-400 py-8">
          <div className="text-4xl mb-2">🔬</div>
          <div>Click "Start Profiling" to analyze component performance</div>
          <div className="text-sm mt-2">
            Profiling will run for {profilingDuration} seconds and analyze all tracked components
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformanceProfiler;