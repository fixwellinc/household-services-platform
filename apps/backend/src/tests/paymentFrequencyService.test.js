import { describe, it, expect, beforeEach } from 'vitest';
import PaymentFrequencyService from '../services/paymentFrequencyService.js';

describe('PaymentFrequencyService', () => {
  let service;

  beforeEach(() => {
    service = PaymentFrequencyService;
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
        service.calculatePaymentAmount('STARTER', 'INVALID');
      }).toThrow('Invalid frequency: INVALID');
    });

    it('should throw error for missing parameters', () => {
      expect(() => {
        service.calculatePaymentAmount(null, 'MONTHLY');
      }).toThrow('Plan tier and frequency are required');
      
      expect(() => {
        service.calculatePaymentAmount('STARTER', null);
      }).toThrow('Plan tier and frequency are required');
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
    it('should return all frequency options for a plan tier', () => {
      const options = service.getFrequencyOptions('STARTER');
      
      expect(options).toHaveLength(2);
      expect(options.map(opt => opt.frequency)).toEqual(
        expect.arrayContaining(['MONTHLY', 'YEARLY'])
      );
    });

    it('should sort options by savings (highest first)', () => {
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

    it('should throw error for invalid plan tier', () => {
      expect(() => {
        service.getFrequencyOptions('INVALID');
      }).toThrow('Invalid plan tier: INVALID');
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

    it('should use last payment date when provided', () => {
      const lastPayment = new Date('2024-01-01T10:00:00Z');
      const nextDate = service.getNextPaymentDate('MONTHLY', baseDate, lastPayment);
      const expected = new Date('2024-02-01T10:00:00Z');
      
      expect(nextDate.getTime()).toBe(expected.getTime());
    });

    it('should throw error for invalid frequency', () => {
      expect(() => {
        service.getNextPaymentDate('INVALID', baseDate);
      }).toThrow('Invalid frequency: INVALID');
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
      expect(result.reason).toBe('New frequency must be different from current frequency');
    });

    it('should reject invalid current frequency', () => {
      const result = service.validateFrequencyChange('INVALID', 'MONTHLY', mockSubscription);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid current frequency: INVALID');
    });

    it('should reject invalid new frequency', () => {
      const result = service.validateFrequencyChange('MONTHLY', 'INVALID', mockSubscription);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid new frequency: INVALID');
    });

    it('should reject change for inactive subscription', () => {
      const inactiveSubscription = { ...mockSubscription, status: 'CANCELLED' };
      const result = service.validateFrequencyChange('MONTHLY', 'QUARTERLY', inactiveSubscription);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Frequency can only be changed for active subscriptions');
    });

    it('should reject change for paused subscription', () => {
      const pausedSubscription = { ...mockSubscription, isPaused: true };
      const result = service.validateFrequencyChange('MONTHLY', 'QUARTERLY', pausedSubscription);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Cannot change frequency while subscription is paused');
    });

    it('should require both frequencies', () => {
      const result1 = service.validateFrequencyChange(null, 'MONTHLY', mockSubscription);
      const result2 = service.validateFrequencyChange('MONTHLY', null, mockSubscription);
      
      expect(result1.valid).toBe(false);
      expect(result1.reason).toBe('Current and new frequency are required');
      expect(result2.valid).toBe(false);
      expect(result2.reason).toBe('Current and new frequency are required');
    });
  });

  describe('calculateProration', () => {
    const lastPaymentDate = new Date('2024-01-01T00:00:00Z');
    const changeDate = new Date('2024-01-15T00:00:00Z'); // 15 days into monthly period

    it('should calculate proration for monthly to quarterly change', () => {
      const result = service.calculateProration('MONTHLY', 'QUARTERLY', 'STARTER', lastPaymentDate, changeDate);
      
      // Monthly period: Jan 1 - Feb 1 (31 days)
      // Used: 15 days, Remaining: 16 days
      const dailyRate = 21.99 / 31; // ~0.709
      const usedAmount = dailyRate * 15; // ~10.64
      const refundAmount = 21.99 - usedAmount; // ~11.35
      
      expect(result.currentPeriod.totalDays).toBe(31);
      expect(result.currentPeriod.daysUsed).toBe(14);
      expect(result.currentPeriod.daysRemaining).toBe(17);
      expect(result.currentPeriod.usedAmount).toBeCloseTo(9.93, 1);
      expect(result.currentPeriod.refundAmount).toBeCloseTo(12.06, 1);
      
      // New quarterly amount: 62.67 (with 5% discount)
      expect(result.newPeriod.paymentAmount).toBe(62.67);
      expect(result.newPeriod.frequency).toBe('QUARTERLY');
      
      // Net adjustment: 62.67 - 12.06 = 50.61
      expect(result.netAdjustment).toBeCloseTo(50.61, 1);
    });

    it('should calculate proration for quarterly to monthly change', () => {
      const quarterlyLastPayment = new Date('2024-01-01T00:00:00Z');
      const quarterlyChangeDate = new Date('2024-02-01T00:00:00Z'); // 31 days into quarterly period
      
      const result = service.calculateProration('QUARTERLY', 'MONTHLY', 'HOMECARE', quarterlyLastPayment, quarterlyChangeDate);
      
      // Quarterly period: Jan 1 - Apr 1 (91 days)
      // Used: 31 days, Remaining: 60 days
      expect(result.currentPeriod.totalDays).toBe(91);
      expect(result.currentPeriod.daysUsed).toBe(31);
      expect(result.currentPeriod.daysRemaining).toBe(60);
      
      // New monthly amount: 54.99
      expect(result.newPeriod.paymentAmount).toBe(54.99);
      expect(result.newPeriod.frequency).toBe('MONTHLY');
    });

    it('should handle edge case of change on payment date', () => {
      const sameDate = new Date('2024-01-01T00:00:00Z');
      const result = service.calculateProration('MONTHLY', 'WEEKLY', 'PRIORITY', sameDate, sameDate);
      
      expect(result.currentPeriod.daysUsed).toBe(0);
      expect(result.currentPeriod.usedAmount).toBe(0);
      expect(result.currentPeriod.refundAmount).toBe(120.99);
    });
  });

  describe('getFrequencyComparison', () => {
    it('should return comparison data for all frequencies', () => {
      const comparison = service.getFrequencyComparison('STARTER');
      
      expect(comparison.planTier).toBe('STARTER');
      expect(comparison.currentFrequency).toBeNull();
      expect(comparison.options).toHaveLength(5);
      expect(comparison.monthlyBaseline.frequency).toBe('MONTHLY');
      expect(comparison.bestSavings.frequency).toBe('YEARLY'); // Highest savings
    });

    it('should mark current frequency correctly', () => {
      const comparison = service.getFrequencyComparison('HOMECARE', 'QUARTERLY');
      
      expect(comparison.currentFrequency).toBe('QUARTERLY');
      
      const currentOption = comparison.options.find(opt => opt.isCurrent);
      expect(currentOption.frequency).toBe('QUARTERLY');
      
      const nonCurrentOptions = comparison.options.filter(opt => !opt.isCurrent);
      expect(nonCurrentOptions).toHaveLength(4);
    });

    it('should include savings calculations for each option', () => {
      const comparison = service.getFrequencyComparison('PRIORITY');
      
      comparison.options.forEach(option => {
        expect(option).toHaveProperty('savingsVsMonthly');
        expect(option).toHaveProperty('savingsPercentage');
        expect(typeof option.savingsVsMonthly).toBe('number');
        expect(typeof option.savingsPercentage).toBe('number');
      });
      
      // Yearly should have positive savings
      const yearlyOption = comparison.options.find(opt => opt.frequency === 'YEARLY');
      expect(yearlyOption.savingsVsMonthly).toBeGreaterThan(0);
      
      // Weekly should have negative savings (costs more)
      const weeklyOption = comparison.options.find(opt => opt.frequency === 'WEEKLY');
      expect(weeklyOption.savingsVsMonthly).toBeLessThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle leap year calculations correctly', () => {
      const leapYearDate = new Date('2024-02-29T00:00:00Z'); // Leap year
      const nextYear = service.getNextPaymentDate('YEARLY', leapYearDate);
      
      // Should go to March 1, 2025 (JavaScript date behavior)
      expect(nextYear.getFullYear()).toBe(2025);
      expect(nextYear.getMonth()).toBe(2); // March (0-indexed)
      expect(nextYear.getDate()).toBe(1);
    });

    it('should handle month-end edge cases', () => {
      const jan31 = new Date('2024-01-31T00:00:00Z');
      const nextMonth = service.getNextPaymentDate('MONTHLY', jan31);
      
      // Should go to March 2, 2024 (JavaScript date behavior)
      expect(nextMonth.getFullYear()).toBe(2024);
      expect(nextMonth.getMonth()).toBe(2); // March
      expect(nextMonth.getDate()).toBe(2);
    });

    it('should round payment amounts to 2 decimal places', () => {
      // Test with a plan that might produce rounding issues
      const result = service.calculatePaymentAmount('STARTER', 'WEEKLY');
      
      // 21.99 * 0.25 = 5.4975, should round to 5.50
      expect(result.pricing.paymentAmount).toBe(5.50);
      expect(result.pricing.paymentAmount.toString()).not.toContain('5.4975');
    });

    it('should handle very small discount amounts', () => {
      // Create a scenario where discount might be very small
      const result = service.calculatePaymentAmount('STARTER', 'QUARTERLY');
      
      expect(result.pricing.discountAmount).toBeGreaterThan(0);
      expect(result.pricing.discountAmount).toBe(3.30); // Should be properly rounded
    });
  });
});