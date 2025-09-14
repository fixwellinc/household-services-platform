import { getPlanByTier } from '../config/plans.js';

/**
 * PaymentFrequencyService handles payment frequency calculations and conversions
 * Supports weekly, bi-weekly, monthly, quarterly, and yearly payment frequencies
 */
class PaymentFrequencyService {
  constructor() {
    // Payment frequency configurations - simplified to monthly and yearly only
    this.frequencies = {
      MONTHLY: {
        multiplier: 1, // 100% of monthly amount (base)
        periodsPerYear: 12,
        discount: 0, // No discount for monthly (base rate)
        label: 'Monthly',
        description: 'Charged every month'
      },
      YEARLY: {
        multiplier: 12, // 12 months worth
        periodsPerYear: 1,
        discount: 0.10, // 10% discount for yearly (matches existing yearly pricing)
        label: 'Yearly',
        description: 'Charged once per year (10% discount)'
      }
    };
  }

  /**
   * Calculate payment amount for a given plan tier and frequency
   * @param {string} planTier - The subscription tier (STARTER, HOMECARE, PRIORITY)
   * @param {string} frequency - Payment frequency (WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY)
   * @returns {Object} Payment calculation details
   */
  calculatePaymentAmount(planTier, frequency) {
    try {
      // Validate inputs
      if (!planTier || !frequency) {
        throw new Error('Plan tier and frequency are required');
      }

      const plan = getPlanByTier(planTier);
      if (!plan) {
        throw new Error(`Invalid plan tier: ${planTier}`);
      }

      const frequencyConfig = this.frequencies[frequency.toUpperCase()];
      if (!frequencyConfig) {
        throw new Error(`Invalid frequency: ${frequency}`);
      }

      // Base monthly price
      const monthlyPrice = plan.monthlyPrice;
      
      // Calculate base amount for the frequency period
      const baseAmount = monthlyPrice * frequencyConfig.multiplier;
      
      // Apply discount if applicable
      const discountAmount = baseAmount * frequencyConfig.discount;
      const finalAmount = baseAmount - discountAmount;
      
      // Calculate annual totals for comparison
      const annualBaseAmount = Math.round(baseAmount * frequencyConfig.periodsPerYear * 100) / 100;
      const annualDiscountAmount = Math.round(discountAmount * frequencyConfig.periodsPerYear * 100) / 100;
      const annualFinalAmount = Math.round(finalAmount * frequencyConfig.periodsPerYear * 100) / 100;
      
      // Calculate savings compared to monthly payments
      const monthlyAnnualTotal = monthlyPrice * 12;
      const annualSavings = monthlyAnnualTotal - annualFinalAmount;
      const savingsPercentage = (annualSavings / monthlyAnnualTotal) * 100;

      return {
        planTier,
        frequency: frequency.toUpperCase(),
        frequencyConfig,
        pricing: {
          monthlyBasePrice: monthlyPrice,
          paymentAmount: Math.round(finalAmount * 100) / 100, // Round to 2 decimal places
          baseAmount: Math.round(baseAmount * 100) / 100,
          discountAmount: Math.round(discountAmount * 100) / 100,
          discountPercentage: frequencyConfig.discount * 100
        },
        annual: {
          totalPayments: annualFinalAmount,
          totalDiscount: annualDiscountAmount,
          savingsVsMonthly: Math.round(annualSavings * 100) / 100,
          savingsPercentage: Math.round(savingsPercentage * 100) / 100
        },
        schedule: {
          periodsPerYear: frequencyConfig.periodsPerYear,
          label: frequencyConfig.label,
          description: frequencyConfig.description
        }
      };
    } catch (error) {
      console.error('Error calculating payment amount:', error);
      throw error;
    }
  }

  /**
   * Get all available frequency options for a plan tier
   * @param {string} planTier - The subscription tier
   * @returns {Array} Array of frequency options with calculations
   */
  getFrequencyOptions(planTier) {
    try {
      const plan = getPlanByTier(planTier);
      if (!plan) {
        throw new Error(`Invalid plan tier: ${planTier}`);
      }

      const options = [];
      
      // Calculate for each frequency
      Object.keys(this.frequencies).forEach(frequency => {
        try {
          const calculation = this.calculatePaymentAmount(planTier, frequency);
          options.push({
            frequency,
            ...calculation,
            recommended: frequency === 'YEARLY' // Recommend yearly for maximum savings
          });
        } catch (error) {
          console.error(`Error calculating ${frequency} for ${planTier}:`, error);
        }
      });

      // Sort by annual savings (highest savings first)
      return options.sort((a, b) => b.annual.savingsVsMonthly - a.annual.savingsVsMonthly);
    } catch (error) {
      console.error('Error getting frequency options:', error);
      throw error;
    }
  }

  /**
   * Calculate the next payment date based on frequency
   * @param {string} frequency - Payment frequency
   * @param {Date} currentDate - Current date (defaults to now)
   * @param {Date} lastPaymentDate - Last payment date (optional)
   * @returns {Date} Next payment date
   */
  getNextPaymentDate(frequency, currentDate = new Date(), lastPaymentDate = null) {
    try {
      const frequencyConfig = this.frequencies[frequency.toUpperCase()];
      if (!frequencyConfig) {
        throw new Error(`Unsupported frequency: ${frequency}. Only MONTHLY and YEARLY are supported.`);
      }

      const baseDate = lastPaymentDate || currentDate;
      const nextDate = new Date(baseDate);

      switch (frequency.toUpperCase()) {
        case 'MONTHLY':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'YEARLY':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
        default:
          throw new Error(`Unsupported frequency: ${frequency}. Only MONTHLY and YEARLY are supported.`);
      }

      return nextDate;
    } catch (error) {
      console.error('Error calculating next payment date:', error);
      throw error;
    }
  }

  /**
   * Validate if a frequency change is allowed
   * @param {string} currentFrequency - Current payment frequency
   * @param {string} newFrequency - Desired new frequency
   * @param {Object} subscriptionData - Current subscription data
   * @returns {Object} Validation result
   */
  validateFrequencyChange(currentFrequency, newFrequency, subscriptionData = {}) {
    try {
      // Basic validation
      if (!currentFrequency || !newFrequency) {
        return {
          valid: false,
          reason: 'Current and new frequency are required'
        };
      }

      if (currentFrequency.toUpperCase() === newFrequency.toUpperCase()) {
        return {
          valid: false,
          reason: 'New frequency must be different from current frequency'
        };
      }

      // Check if frequencies are supported
      if (!this.frequencies[currentFrequency.toUpperCase()]) {
        return {
          valid: false,
          reason: `Invalid current frequency: ${currentFrequency}`
        };
      }

      if (!this.frequencies[newFrequency.toUpperCase()]) {
        return {
          valid: false,
          reason: `Invalid new frequency: ${newFrequency}`
        };
      }

      // Check subscription status
      if (subscriptionData.status && subscriptionData.status !== 'ACTIVE') {
        return {
          valid: false,
          reason: 'Frequency can only be changed for active subscriptions'
        };
      }

      // Check if subscription is paused
      if (subscriptionData.isPaused) {
        return {
          valid: false,
          reason: 'Cannot change frequency while subscription is paused'
        };
      }

      // All validations passed
      return {
        valid: true,
        reason: null
      };
    } catch (error) {
      console.error('Error validating frequency change:', error);
      return {
        valid: false,
        reason: 'Error validating frequency change'
      };
    }
  }

  /**
   * Calculate prorated amount for frequency changes
   * @param {string} currentFrequency - Current payment frequency
   * @param {string} newFrequency - New payment frequency
   * @param {string} planTier - Subscription tier
   * @param {Date} lastPaymentDate - Last payment date
   * @param {Date} changeDate - Date of frequency change
   * @returns {Object} Proration calculation
   */
  calculateProration(currentFrequency, newFrequency, planTier, lastPaymentDate, changeDate = new Date()) {
    try {
      const currentCalc = this.calculatePaymentAmount(planTier, currentFrequency);
      const newCalc = this.calculatePaymentAmount(planTier, newFrequency);
      
      // Calculate days remaining in current period
      const nextPaymentDate = this.getNextPaymentDate(currentFrequency, lastPaymentDate);
      const totalDaysInPeriod = Math.ceil((nextPaymentDate - lastPaymentDate) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.ceil((nextPaymentDate - changeDate) / (1000 * 60 * 60 * 24));
      const daysUsed = totalDaysInPeriod - daysRemaining;
      
      // Calculate prorated amounts
      const dailyRate = currentCalc.pricing.paymentAmount / totalDaysInPeriod;
      const usedAmount = dailyRate * daysUsed;
      const refundAmount = currentCalc.pricing.paymentAmount - usedAmount;
      
      // Calculate next payment date and amount
      const nextPayment = this.getNextPaymentDate(newFrequency, changeDate);
      
      return {
        currentPeriod: {
          totalAmount: currentCalc.pricing.paymentAmount,
          usedAmount: Math.round(usedAmount * 100) / 100,
          refundAmount: Math.round(refundAmount * 100) / 100,
          daysUsed,
          daysRemaining,
          totalDays: totalDaysInPeriod
        },
        newPeriod: {
          paymentAmount: newCalc.pricing.paymentAmount,
          nextPaymentDate: nextPayment,
          frequency: newFrequency.toUpperCase()
        },
        netAdjustment: Math.round((newCalc.pricing.paymentAmount - refundAmount) * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating proration:', error);
      throw error;
    }
  }

  /**
   * Get frequency comparison data for UI display
   * @param {string} planTier - Subscription tier
   * @param {string} currentFrequency - Current frequency (optional)
   * @returns {Object} Comparison data
   */
  getFrequencyComparison(planTier, currentFrequency = null) {
    try {
      const options = this.getFrequencyOptions(planTier);
      const monthlyOption = options.find(opt => opt.frequency === 'MONTHLY');
      
      return {
        planTier,
        currentFrequency: currentFrequency?.toUpperCase() || null,
        monthlyBaseline: monthlyOption,
        options: options.map(option => ({
          ...option,
          isCurrent: currentFrequency && option.frequency === currentFrequency.toUpperCase(),
          savingsVsMonthly: option.annual.savingsVsMonthly,
          savingsPercentage: option.annual.savingsPercentage
        })),
        bestSavings: options[0] // First option has highest savings
      };
    } catch (error) {
      console.error('Error getting frequency comparison:', error);
      throw error;
    }
  }
}

export default new PaymentFrequencyService();