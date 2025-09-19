/**
 * Tests for BaseReporter utilities
 */

import { ReportUtils } from '../BaseReporter';
import { Finding } from '../../types';

describe('ReportUtils', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(ReportUtils.formatFileSize(0)).toBe('0.0 B');
      expect(ReportUtils.formatFileSize(512)).toBe('512.0 B');
      expect(ReportUtils.formatFileSize(1023)).toBe('1023.0 B');
    });

    it('should format kilobytes correctly', () => {
      expect(ReportUtils.formatFileSize(1024)).toBe('1.0 KB');
      expect(ReportUtils.formatFileSize(1536)).toBe('1.5 KB');
      expect(ReportUtils.formatFileSize(1048575)).toBe('1024.0 KB');
    });

    it('should format megabytes correctly', () => {
      expect(ReportUtils.formatFileSize(1048576)).toBe('1.0 MB');
      expect(ReportUtils.formatFileSize(1572864)).toBe('1.5 MB');
      expect(ReportUtils.formatFileSize(1073741823)).toBe('1024.0 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(ReportUtils.formatFileSize(1073741824)).toBe('1.0 GB');
      expect(ReportUtils.formatFileSize(1610612736)).toBe('1.5 GB');
    });
  });

  describe('formatPercentage', () => {
    it('should handle zero total', () => {
      expect(ReportUtils.formatPercentage(5, 0)).toBe('0%');
    });

    it('should format percentages correctly', () => {
      expect(ReportUtils.formatPercentage(25, 100)).toBe('25.0%');
      expect(ReportUtils.formatPercentage(33, 100)).toBe('33.0%');
      expect(ReportUtils.formatPercentage(1, 3)).toBe('33.3%');
    });

    it('should handle edge cases', () => {
      expect(ReportUtils.formatPercentage(0, 100)).toBe('0.0%');
      expect(ReportUtils.formatPercentage(100, 100)).toBe('100.0%');
    });
  });

  describe('sortFindingsByPriority', () => {
    const createFinding = (
      type: Finding['type'],
      files: number = 1,
      size: number = 1024
    ): Finding => ({
      type,
      files: [`file${files}.ts`],
      description: `Test ${type} finding`,
      recommendation: 'Test recommendation',
      autoFixable: true,
      estimatedSavings: { files, size }
    });

    it('should sort by impact (files + size)', () => {
      const findings = [
        createFinding('duplicate', 1, 1024), // Impact: 2
        createFinding('unused', 5, 2048), // Impact: 7
        createFinding('obsolete', 2, 512) // Impact: 2.5
      ];

      const sorted = ReportUtils.sortFindingsByPriority(findings);
      
      expect(sorted[0].type).toBe('unused'); // Highest impact
      expect(sorted[1].type).toBe('obsolete');
      expect(sorted[2].type).toBe('duplicate');
    });

    it('should sort by type when impact is equal', () => {
      const findings = [
        createFinding('inconsistent', 1, 1024),
        createFinding('duplicate', 1, 1024),
        createFinding('unused', 1, 1024),
        createFinding('obsolete', 1, 1024)
      ];

      const sorted = ReportUtils.sortFindingsByPriority(findings);
      
      expect(sorted[0].type).toBe('duplicate'); // Highest type priority
      expect(sorted[1].type).toBe('unused');
      expect(sorted[2].type).toBe('obsolete');
      expect(sorted[3].type).toBe('inconsistent');
    });

    it('should handle findings without estimated savings', () => {
      const findings = [
        { ...createFinding('duplicate'), estimatedSavings: undefined },
        createFinding('unused', 2, 1024)
      ];

      const sorted = ReportUtils.sortFindingsByPriority(findings);
      
      expect(sorted[0].type).toBe('unused'); // Has savings
      expect(sorted[1].type).toBe('duplicate'); // No savings
    });
  });

  describe('groupFindingsByType', () => {
    it('should group findings by type correctly', () => {
      const findings = [
        { type: 'duplicate', files: ['file1.ts'], description: 'Dup 1', recommendation: 'Fix 1', autoFixable: true },
        { type: 'unused', files: ['file2.ts'], description: 'Unused 1', recommendation: 'Fix 2', autoFixable: true },
        { type: 'duplicate', files: ['file3.ts'], description: 'Dup 2', recommendation: 'Fix 3', autoFixable: true },
        { type: 'obsolete', files: ['file4.ts'], description: 'Obs 1', recommendation: 'Fix 4', autoFixable: false }
      ] as Finding[];

      const grouped = ReportUtils.groupFindingsByType(findings);

      expect(Object.keys(grouped)).toEqual(['duplicate', 'unused', 'obsolete']);
      expect(grouped.duplicate).toHaveLength(2);
      expect(grouped.unused).toHaveLength(1);
      expect(grouped.obsolete).toHaveLength(1);
    });

    it('should handle empty findings array', () => {
      const grouped = ReportUtils.groupFindingsByType([]);
      expect(grouped).toEqual({});
    });
  });

  describe('calculateTotalSavings', () => {
    it('should calculate total savings correctly', () => {
      const findings = [
        {
          type: 'duplicate',
          files: ['file1.ts'],
          description: 'Test',
          recommendation: 'Test',
          autoFixable: true,
          estimatedSavings: { files: 2, size: 1024, dependencies: 1 }
        },
        {
          type: 'unused',
          files: ['file2.ts'],
          description: 'Test',
          recommendation: 'Test',
          autoFixable: true,
          estimatedSavings: { files: 3, size: 2048, dependencies: 2 }
        }
      ] as Finding[];

      const total = ReportUtils.calculateTotalSavings(findings);

      expect(total).toEqual({
        files: 5,
        size: 3072,
        dependencies: 3
      });
    });

    it('should handle findings without savings', () => {
      const findings = [
        {
          type: 'duplicate',
          files: ['file1.ts'],
          description: 'Test',
          recommendation: 'Test',
          autoFixable: true
        },
        {
          type: 'unused',
          files: ['file2.ts'],
          description: 'Test',
          recommendation: 'Test',
          autoFixable: true,
          estimatedSavings: { files: 1, size: 1024 }
        }
      ] as Finding[];

      const total = ReportUtils.calculateTotalSavings(findings);

      expect(total).toEqual({
        files: 1,
        size: 1024,
        dependencies: 0
      });
    });

    it('should handle empty findings array', () => {
      const total = ReportUtils.calculateTotalSavings([]);
      expect(total).toEqual({
        files: 0,
        size: 0,
        dependencies: 0
      });
    });
  });

  describe('getRiskColor', () => {
    it('should return correct colors for risk levels', () => {
      expect(ReportUtils.getRiskColor('safe')).toBe('\x1b[32m');
      expect(ReportUtils.getRiskColor('review')).toBe('\x1b[33m');
      expect(ReportUtils.getRiskColor('manual')).toBe('\x1b[31m');
      expect(ReportUtils.getRiskColor('unknown')).toBe('\x1b[0m');
    });
  });

  describe('getTypeIcon', () => {
    it('should return correct icons for finding types', () => {
      expect(ReportUtils.getTypeIcon('duplicate')).toBe('📋');
      expect(ReportUtils.getTypeIcon('unused')).toBe('🗑️');
      expect(ReportUtils.getTypeIcon('obsolete')).toBe('⏰');
      expect(ReportUtils.getTypeIcon('inconsistent')).toBe('⚠️');
      expect(ReportUtils.getTypeIcon('unknown')).toBe('📄');
    });
  });
});