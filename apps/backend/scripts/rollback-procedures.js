const { PrismaClient } = require('@prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs').promises;
const path = require('path');

/**
 * Rollback Procedures for Critical Payment Functions
 * 
 * This script provides rollback procedures for critical payment system changes
 * Use these functions to safely revert changes in case of production issues
 */

class RollbackProcedures {
  constructor() {
    this.prisma = new PrismaClient();
    this.backupPath = process.env.BACKUP_STORAGE_PATH || '/var/backups/fixwell';
  }

  /**
   * Create a backup before making critical changes
   */
  async createBackup(backupName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `${this.backupPath}/${backupName}_${timestamp}.json`;

    try {
      // Backup critical tables
      const backup = {
        timestamp,
        subscriptions: await this.prisma.subscription.findMany(),
        paymentFrequencies: await this.prisma.paymentFrequency.findMany(),
        subscriptionPauses: await this.prisma.subscriptionPause.findMany(),
        rewardCredits: await this.prisma.rewardCredit.findMany(),
        additionalProperties: await this.prisma.additionalProperty.findMany(),
        familyMembers: await this.prisma.familyMember.findMany(),
        installmentPlans: await this.prisma.installmentPlan.findMany()
      };

      await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
      console.log(`Backup created: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Rollback payment frequency changes
   */
  async rollbackPaymentFrequencyChanges(subscriptionIds = []) {
    console.log('Starting payment frequency rollback...');
    
    try {
      const subscriptions = subscriptionIds.length > 0 
        ? await this.prisma.subscription.findMany({
            where: { id: { in: subscriptionIds } },
            include: { paymentFrequencies: true }
          })
        : await this.prisma.subscription.findMany({
            where: { 
              paymentFrequency: { not: 'MONTHLY' } // Rollback non-monthly frequencies
            },
            include: { paymentFrequencies: true }
          });

      for (const subscription of subscriptions) {
        // Revert to monthly frequency
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            paymentFrequency: 'MONTHLY',
            nextPaymentAmount: null // Reset to default calculation
          }
        });

        // Update Stripe subscription to monthly
        if (subscription.stripeSubscriptionId) {
          try {
            await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
              billing_cycle_anchor: 'now',
              proration_behavior: 'create_prorations'
            });
          } catch (stripeError) {
            console.error(`Failed to update Stripe subscription ${subscription.stripeSubscriptionId}:`, stripeError);
          }
        }

        console.log(`Rolled back subscription ${subscription.id} to monthly frequency`);
      }

      console.log(`Payment frequency rollback completed for ${subscriptions.length} subscriptions`);
    } catch (error) {
      console.error('Payment frequency rollback failed:', error);
      throw error;
    }
  }

  /**
   * Rollback subscription pause system
   */
  async rollbackSubscriptionPauses(resumeAll = false) {
    console.log('Starting subscription pause rollback...');
    
    try {
      if (resumeAll) {
        // Resume all paused subscriptions
        const pausedSubscriptions = await this.prisma.subscription.findMany({
          where: { isPaused: true }
        });

        for (const subscription of pausedSubscriptions) {
          await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              isPaused: false,
              pauseStartDate: null,
              pauseEndDate: null,
              status: 'ACTIVE'
            }
          });

          // Resume Stripe subscription
          if (subscription.stripeSubscriptionId) {
            try {
              await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                pause_collection: null
              });
            } catch (stripeError) {
              console.error(`Failed to resume Stripe subscription ${subscription.stripeSubscriptionId}:`, stripeError);
            }
          }

          console.log(`Resumed subscription ${subscription.id}`);
        }
      }

      // Mark all active pauses as completed
      await this.prisma.subscriptionPause.updateMany({
        where: { status: 'ACTIVE' },
        data: { status: 'CANCELLED' }
      });

      console.log('Subscription pause rollback completed');
    } catch (error) {
      console.error('Subscription pause rollback failed:', error);
      throw error;
    }
  }

  /**
   * Rollback rewards system
   */
  async rollbackRewardsSystem(removeCredits = false) {
    console.log('Starting rewards system rollback...');
    
    try {
      if (removeCredits) {
        // Remove all unused reward credits
        await this.prisma.rewardCredit.deleteMany({
          where: { usedAt: null }
        });

        // Reset subscription credit balances
        await this.prisma.subscription.updateMany({
          data: { availableCredits: 0, loyaltyPoints: 0 }
        });
      } else {
        // Just mark credits as expired
        await this.prisma.rewardCredit.updateMany({
          where: { usedAt: null },
          data: { expiresAt: new Date() }
        });
      }

      console.log('Rewards system rollback completed');
    } catch (error) {
      console.error('Rewards system rollback failed:', error);
      throw error;
    }
  }

  /**
   * Rollback additional properties feature
   */
  async rollbackAdditionalProperties() {
    console.log('Starting additional properties rollback...');
    
    try {
      // Remove all additional properties
      const properties = await this.prisma.additionalProperty.findMany();
      
      for (const property of properties) {
        // Cancel any Stripe line items for additional properties
        const subscription = await this.prisma.subscription.findUnique({
          where: { id: property.subscriptionId }
        });

        if (subscription?.stripeSubscriptionId) {
          try {
            const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
            // Remove additional property line items if they exist
            // This would require custom implementation based on how you track these in Stripe
          } catch (stripeError) {
            console.error(`Failed to update Stripe for property ${property.id}:`, stripeError);
          }
        }
      }

      // Delete all additional properties
      await this.prisma.additionalProperty.deleteMany();

      console.log(`Removed ${properties.length} additional properties`);
    } catch (error) {
      console.error('Additional properties rollback failed:', error);
      throw error;
    }
  }

  /**
   * Rollback family member feature
   */
  async rollbackFamilyMembers() {
    console.log('Starting family members rollback...');
    
    try {
      const familyMembers = await this.prisma.familyMember.findMany();
      
      // Remove all family member associations
      await this.prisma.familyMember.deleteMany();

      console.log(`Removed ${familyMembers.length} family member associations`);
    } catch (error) {
      console.error('Family members rollback failed:', error);
      throw error;
    }
  }

  /**
   * Complete system rollback to pre-flexible-payment state
   */
  async completeSystemRollback(options = {}) {
    console.log('Starting complete system rollback...');
    
    const {
      createBackup: shouldBackup = true,
      rollbackPaymentFrequencies = true,
      rollbackPauses = true,
      rollbackRewards = true,
      rollbackProperties = true,
      rollbackFamilyMembers = true
    } = options;

    try {
      // Create backup before rollback
      if (shouldBackup) {
        await this.createBackup('complete_rollback');
      }

      // Execute rollbacks in reverse order of implementation
      if (rollbackFamilyMembers) {
        await this.rollbackFamilyMembers();
      }

      if (rollbackProperties) {
        await this.rollbackAdditionalProperties();
      }

      if (rollbackRewards) {
        await this.rollbackRewardsSystem(true);
      }

      if (rollbackPauses) {
        await this.rollbackSubscriptionPauses(true);
      }

      if (rollbackPaymentFrequencies) {
        await this.rollbackPaymentFrequencyChanges();
      }

      // Reset subscription fields to defaults
      await this.prisma.subscription.updateMany({
        data: {
          paymentFrequency: 'MONTHLY',
          nextPaymentAmount: null,
          isPaused: false,
          pauseStartDate: null,
          pauseEndDate: null,
          availableCredits: 0,
          loyaltyPoints: 0,
          churnRiskScore: 0,
          lifetimeValue: 0
        }
      });

      console.log('Complete system rollback completed successfully');
    } catch (error) {
      console.error('Complete system rollback failed:', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupFile) {
    console.log(`Restoring from backup: ${backupFile}`);
    
    try {
      const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));

      // Restore in transaction
      await this.prisma.$transaction(async (tx) => {
        // Clear existing data
        await tx.installmentPlan.deleteMany();
        await tx.familyMember.deleteMany();
        await tx.additionalProperty.deleteMany();
        await tx.rewardCredit.deleteMany();
        await tx.subscriptionPause.deleteMany();
        await tx.paymentFrequency.deleteMany();

        // Restore data
        if (backupData.paymentFrequencies?.length > 0) {
          await tx.paymentFrequency.createMany({ data: backupData.paymentFrequencies });
        }
        
        if (backupData.subscriptionPauses?.length > 0) {
          await tx.subscriptionPause.createMany({ data: backupData.subscriptionPauses });
        }
        
        if (backupData.rewardCredits?.length > 0) {
          await tx.rewardCredit.createMany({ data: backupData.rewardCredits });
        }
        
        if (backupData.additionalProperties?.length > 0) {
          await tx.additionalProperty.createMany({ data: backupData.additionalProperties });
        }
        
        if (backupData.familyMembers?.length > 0) {
          await tx.familyMember.createMany({ data: backupData.familyMembers });
        }
        
        if (backupData.installmentPlans?.length > 0) {
          await tx.installmentPlan.createMany({ data: backupData.installmentPlans });
        }

        // Restore subscription data
        for (const subscription of backupData.subscriptions) {
          await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              paymentFrequency: subscription.paymentFrequency,
              nextPaymentAmount: subscription.nextPaymentAmount,
              isPaused: subscription.isPaused,
              pauseStartDate: subscription.pauseStartDate,
              pauseEndDate: subscription.pauseEndDate,
              availableCredits: subscription.availableCredits,
              loyaltyPoints: subscription.loyaltyPoints,
              churnRiskScore: subscription.churnRiskScore,
              lifetimeValue: subscription.lifetimeValue
            }
          });
        }
      });

      console.log('Backup restoration completed successfully');
    } catch (error) {
      console.error('Backup restoration failed:', error);
      throw error;
    }
  }

  /**
   * Validate system state after rollback
   */
  async validateSystemState() {
    console.log('Validating system state...');
    
    try {
      const validation = {
        subscriptions: await this.prisma.subscription.count(),
        activeSubscriptions: await this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        pausedSubscriptions: await this.prisma.subscription.count({ where: { isPaused: true } }),
        paymentFrequencies: await this.prisma.paymentFrequency.count(),
        rewardCredits: await this.prisma.rewardCredit.count(),
        additionalProperties: await this.prisma.additionalProperty.count(),
        familyMembers: await this.prisma.familyMember.count()
      };

      console.log('System state validation:', validation);
      return validation;
    } catch (error) {
      console.error('System state validation failed:', error);
      throw error;
    }
  }

  async cleanup() {
    await this.prisma.$disconnect();
  }
}

// CLI interface for rollback procedures
if (require.main === module) {
  const rollback = new RollbackProcedures();
  const command = process.argv[2];
  const options = process.argv.slice(3);

  (async () => {
    try {
      switch (command) {
        case 'backup':
          await rollback.createBackup(options[0] || 'manual_backup');
          break;
        case 'rollback-frequencies':
          await rollback.rollbackPaymentFrequencyChanges();
          break;
        case 'rollback-pauses':
          await rollback.rollbackSubscriptionPauses(options[0] === 'resume-all');
          break;
        case 'rollback-rewards':
          await rollback.rollbackRewardsSystem(options[0] === 'remove-credits');
          break;
        case 'rollback-properties':
          await rollback.rollbackAdditionalProperties();
          break;
        case 'rollback-family':
          await rollback.rollbackFamilyMembers();
          break;
        case 'complete-rollback':
          await rollback.completeSystemRollback();
          break;
        case 'restore':
          if (!options[0]) {
            console.error('Please provide backup file path');
            process.exit(1);
          }
          await rollback.restoreFromBackup(options[0]);
          break;
        case 'validate':
          await rollback.validateSystemState();
          break;
        default:
          console.log('Available commands:');
          console.log('  backup [name] - Create a backup');
          console.log('  rollback-frequencies - Rollback payment frequency changes');
          console.log('  rollback-pauses [resume-all] - Rollback subscription pauses');
          console.log('  rollback-rewards [remove-credits] - Rollback rewards system');
          console.log('  rollback-properties - Rollback additional properties');
          console.log('  rollback-family - Rollback family members');
          console.log('  complete-rollback - Complete system rollback');
          console.log('  restore <backup-file> - Restore from backup');
          console.log('  validate - Validate system state');
      }
    } catch (error) {
      console.error('Rollback procedure failed:', error);
      process.exit(1);
    } finally {
      await rollback.cleanup();
    }
  })();
}

module.exports = RollbackProcedures;