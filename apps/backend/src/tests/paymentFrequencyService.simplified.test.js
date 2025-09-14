import { describe, it, expect, beforeEach } from 'vitest';
import paymentFrequencyService from '../services/paymentFrequencyService.js';

describe('PaymentFrequencyService (Simplified - Monthly & Yearly Only)', () => {
  let service;

  beforeEach(() => {
    service = paymentFrequencyService;
  });

  describe('calculatePaymentAmount', () => {
    it('should calculate monthly payment amount correctly (baseline)', () => {
      const result = service.calculatePaymentAmount('PRIORITY', 'MONTHLY');
      
      expect(result.planTier).toBe('PRIORITY');
      expect(result.frequency).toBe('MONTHLY');
      expect(result.pricing.paymentAmount).toBe(120.99); // Base monthly price
      expect(result.pricing.discountAmount).toBe(0);
      expect(result.annual.totalPayments).toBe(1451.88); // 120.99 * 12
      expect(result.schedule.periodsPerYear).toBe(12);
    });

    it('should calculate yearly payment amount with 10% discount', () => {
      const result = service.calculatePaymentAmount('HOMECARE', 'YEARLY');
      
      expect(result.planTier).toBe('HOMECARE');
      expect(result.frequency).toBe('YEARLY');
      
      const baseAmount = 54.99 * 12; // 659.88
      const discountAmount = baseAmount * 0.10; // 65.99
      const finalAmount = baseAmount - discountAmount; // 593.89
      
      expect(result.pricing.baseAmount).toBe(659.88);
      expect(result.pricing.discountAmount).toBe(65.99);
      expect(result.pricing.paymentAmount).toBe(593.89);
      expect(result.pricing.discountPercentage).toBe(10);
      expect(result.annual.totalPayments).toBe(593.89); // Same as payment amount
      expect(result.schedule.periodsPerYear).toBe(1);
    });

    it('should calculate savings vs monthly correctly', () => {
      const monthlyResult = service.calculatePaymentAmount('PRIORITY', 'MONTHLY');
      const yearlyResult = service.calculatePaymentAmount('PRIORITY', 'YEARLY');
      
      const monthlyAnnualTotal = monthlyResult.annual.totalPayments; // 1451.88
      const yearlyAnnualTotal = yearlyResult.annual.totalPayments; // 1306.69
      const expectedSavings = monthlyAnnualTotal - yearlyAnnualTotal; // 145.19
      
      expect(yearlyResult.annual.savingsVsMonthly).toBe(145.19);
      expect(yearlyResult.annual.savingsPercentage).toBe(10);
    });

    it('should throw error for invalid plan tier', () => {
      expect(() => {
        service.calculatePaymentAmount('INVALID', 'MONTHLY');
      }).toThrow('Invalid plan tier: INVALID');
    });

    it('should throw error for invalid frequency', () => {
      expect(() => {
        service.calculatePaymentAmount('STARTER', 'WEEKLY');
      }).toThrow('Invalid frequency: WEEKLY');
    });

    it('should handle case insensitive inputs', () => {
      const result1 = service.calculatePaymentAmount('starter', 'yearly');
      const result2 = service.calculatePaymentAmount('STARTER', 'YEARLY');
      
      expect(result1.pricing.paymentAmount).toBe(result2.pricing.paymentAmount);
      expect(result1.frequency).toBe('YEARLY');
      expect(result1.planTier).toBe('starter');
    });
  });

  describe('getFrequencyOptions', () => {
    it('should return only monthly and yearly options', () => {
      const options = service.getFrequencyOptions('STARTER');
      
      expect(options).toHaveLength(2);
      expect(options.map(opt => opt.frequency)).toEqual(
        expect.arrayContaining(['MONTHLY', 'YEARLY'])
      );
    });

    it('should sort options by savings (yearly first)', () => {
      const options = service.getFrequencyOptions('HOMECARE');
      
      // Yearly should have highest savings
      expect(options[0].frequency).toBe('YEARLY');
      expect(options[1].frequency).toBe('MONTHLY'); // No savings
    });

    it('should mark yearly as recommended', () => {
      const options = service.getFrequencyOptions('PRIORITY');
      const yearlyOption = options.find(opt => opt.frequency === 'YEARLY');
      
      expect(yearlyOption.recommended).toBe(true);
    });
  });

  describe('getNextPaymentDate', () => {
    const baseDate = new Date('2024-01-15T10:00:00Z');

    it('should calculate next monthly payment date', () => {
      const nextDate = service.getNextPaymentDate('MONTHLY', baseDate);
      const expected = new Date('2024-02-15T10:00:00Z');
      
      expect(nextDate.getTime()).toBe(expected.getTime());
    });

    it('should calculate next yearly payment date', () => {
      const nextDate = service.getNextPaymentDate('YEARLY', baseDate);
      const expected = new Date('2025-01-15T10:00:00Z');
      
      expect(nextDate.getTime()).toBe(expected.getTime());
    });

    it('should throw error for invalid frequency', () => {
      expect(() => {
        service.getNextPaymentDate('WEEKLY', baseDate);
      }).toThrow('Unsupported frequency: WEEKLY. Only MONTHLY and YEARLY are supported.');
    });
  });

  describe('validateFrequencyChange', () => {
    const mockSubscription = {
      status: 'ACTIVE',
      isPaused: false
    };

    it('should validate successful frequency change', () => {
      const result = service.validateFrequencyChange('MONTHLY', 'YEARLY', mockSubscription);
      
      expect(result.valid).toBe(true);
      expect(result.reason).toBeNull();
    });

    it('should reject same frequency change', () => {
      const result = service.validateFrequencyChange('MONTHLY', 'MONTHLY', mockSubscription);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('must be different');
    });

    it('should reject invalid frequencies', () => {
      const result = service.validateFrequencyChange('MONTHLY', 'WEEKLY', mockSubscription);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid new frequency');
    });
  });

  describe('calculateProration', () => {
    const lastPaymentDate = new Date('2024-01-01T00:00:00Z');
    const changeDate = new Date('2024-01-15T00:00:00Z'); // 15 days into monthly period

    it('should calculate proration for monthly to yearly change', () => {
      const result = service.calculateProration('MONTHLY', 'YEARLY', 'STARTER', lastPaymentDate, changeDate);
      
      // Monthly period: Jan 1 - Feb 1 (31 days)
      // Used: 14 days (Jan 1 is day 0, Jan 15 is day 14)
      // Remaining: 17 days
      expect(result.currentPeriod.totalDays).toBe(31);
      expect(result.currentPeriod.daysUsed).toBe(14);
      expect(result.currentPeriod.daysRemaining).toBe(17);
      
      // Should have refund amount for unused days
      expect(result.currentPeriod.refundAmount).toBeGreaterThan(0);
      
      // New yearly amount should be calculated
      expect(result.newPeriod.frequency).toBe('YEARLY');
      expect(result.newPeriod.paymentAmount).toBeGreaterThan(0);
    });
  });

  describe('getFrequencyComparison', () => {
    it('should return comparison data for monthly and yearly only', () => {
      const comparison = service.getFrequencyComparison('STARTER');
      
      expect(comparison.planTier).toBe('STARTER');
      expect(comparison.currentFrequency).toBeNull();
      expect(comparison.options).toHaveLength(2);
      expect(comparison.monthlyBaseline.frequency).toBe('MONTHLY');
      expect(comparison.bestSavings.frequency).toBe('YEARLY'); // Highest savings
    });

    it('should mark current frequency correctly', () => {
      const comparison = service.getFrequencyComparison('HOMECARE', 'YEARLY');
      
      expect(comparison.currentFrequency).toBe('YEARLY');
      
      const currentOption = comparison.options.find(opt => opt.isCurrent);
      expect(currentOption.frequency).toBe('YEARLY');
      
      const nonCurrentOptions = comparison.options.filter(opt => !opt.isCurrent);
      expect(nonCurrentOptions).toHaveLength(1);
      expect(nonCurrentOptions[0].frequency).toBe('MONTHLY');
    });

    it('should include savings calculations', () => {
      const comparison = service.getFrequencyComparison('HOMECARE');
      
      // Yearly should have positive savings
      const yearlyOption = comparison.options.find(opt => opt.frequency === 'YEARLY');
      expect(yearlyOption.savingsVsMonthly).toBeGreaterThan(0);
      
      // Monthly should have no savings
      const monthlyOption = comparison.options.find(opt => opt.frequency === 'MONTHLY');
      expect(monthlyOption.savingsVsMonthly).toBe(0);
    });
  });
});