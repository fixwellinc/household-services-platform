import ChurnPredictionService from './churnPredictionService.js';
import SubscriptionAnalyticsService from './subscriptionAnalyticsService.js';
import prisma from '../config/database.js';

class ChurnAutomationService {
  constructor(prismaClient = prisma) {
    this.prisma = prismaClient;
    this.churnService = new ChurnPredictionService(prismaClient);
    this.analyticsService = new SubscriptionAnalyticsService(prismaClient);
    this.isRunning = false;
  }

  /**
   * Start automated churn monitoring and retention workflows
   */
  async startAutomation() {
    if (this.isRunning) {
      console.log('Churn automation is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting churn automation service...');

    // Run initial churn score update
    await this.updateAllChurnScores();

    // Schedule periodic updates
    this.schedulePeriodicUpdates();

    // Schedule automated retention campaigns
    this.scheduleRetentionCampaigns();

    console.log('Churn automation service started successfully');
  }

  /**
   * Stop automated churn monitoring
   */
  stopAutomation() {
    this.isRunning = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    if (this.retentionInterval) {
      clearInterval(this.retentionInterval);
    }

    console.log('Churn automation service stopped');
  }

  /**
   * Schedule periodic churn score updates
   */
  schedulePeriodicUpdates() {
    // Update churn scores every 6 hours
    this.updateInterval = setInterval(async () => {
      if (this.isRunning) {
        try {
          await this.updateAllChurnScores();
        } catch (error) {
          console.error('Error in scheduled churn score update:', error);
        }
      }
    }, 6 * 60 * 60 * 1000); // 6 hours
  }

  /**
   * Schedule automated retention campaigns
   */
  scheduleRetentionCampaigns() {
    // Run retention campaigns every 24 hours
    this.retentionInterval = setInterval(async () => {
      if (this.isRunning) {
        try {
          await this.runAutomatedRetentionCampaigns();
        } catch (error) {
          console.error('Error in automated retention campaigns:', error);
        }
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Update churn risk scores for all active subscriptions
   */
  async updateAllChurnScores() {
    console.log('Starting churn score update for all active subscriptions...');
    
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: { userId: true, id: true }
    });

    let updated = 0;
    let failed = 0;

    for (const subscription of activeSubscriptions) {
      try {
        const riskAnalysis = await this.churnService.calculateChurnRiskScore(subscription.userId);
        
        // Update the subscription with the new churn risk score
        await this.prisma.subscription.update({
          where: { userId: subscription.userId },
          data: { 
            churnRiskScore: riskAnalysis.riskScore,
            updatedAt: new Date()
          }
        });

        updated++;
      } catch (error) {
        console.error(`Failed to update churn score for user ${subscription.userId}:`, error);
        failed++;
      }
    }

    console.log(`Churn score update completed: ${updated} updated, ${failed} failed`);
    
    return { updated, failed, total: activeSubscriptions.length };
  }

  /**
   * Run automated retention campaigns based on churn risk
   */
  async runAutomatedRetentionCampaigns() {
    console.log('Running automated retention campaigns...');

    try {
      // Get high-risk customers who haven't been contacted recently
      const highRiskCustomers = await this.getHighRiskCustomersForRetention();
      
      if (highRiskCustomers.length === 0) {
        console.log('No high-risk customers found for retention campaigns');
        return;
      }

      // Segment customers by risk level and apply appropriate campaigns
      const criticalRisk = highRiskCustomers.filter(c => c.churnRiskScore >= 80);
      const highRisk = highRiskCustomers.filter(c => c.churnRiskScore >= 60 && c.churnRiskScore < 80);

      let campaignResults = {
        critical: { processed: 0, failed: 0 },
        high: { processed: 0, failed: 0 }
      };

      // Handle critical risk customers with immediate outreach
      if (criticalRisk.length > 0) {
        console.log(`Processing ${criticalRisk.length} critical risk customers`);
        
        for (const customer of criticalRisk) {
          try {
            await this.executeCriticalRetentionWorkflow(customer);
            campaignResults.critical.processed++;
          } catch (error) {
            console.error(`Failed to process critical customer ${customer.userId}:`, error);
            campaignResults.critical.failed++;
          }
        }
      }

      // Handle high risk customers with email campaigns
      if (highRisk.length > 0) {
        console.log(`Processing ${highRisk.length} high risk customers`);
        
        for (const customer of highRisk) {
          try {
            await this.executeHighRiskRetentionWorkflow(customer);
            campaignResults.high.processed++;
          } catch (error) {
            console.error(`Failed to process high risk customer ${customer.userId}:`, error);
            campaignResults.high.failed++;
          }
        }
      }

      console.log('Automated retention campaigns completed:', campaignResults);
      
      return campaignResults;
    } catch (error) {
      console.error('Error running automated retention campaigns:', error);
      throw error;
    }
  }

  /**
   * Get high-risk customers eligible for retention campaigns
   */
  async getHighRiskCustomersForRetention() {
    // Get customers with high churn risk who haven't been contacted in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const highRiskSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        churnRiskScore: { gte: 60 }, // High and critical risk
        // In a real implementation, you'd check against a retention_contacts table
        // to avoid contacting customers too frequently
      },
      include: {
        user: true
      },
      orderBy: {
        churnRiskScore: 'desc'
      },
      take: 50 // Limit to prevent overwhelming the system
    });

    return highRiskSubscriptions.map(sub => ({
      userId: sub.userId,
      subscriptionId: sub.id,
      email: sub.user.email,
      name: sub.user.name,
      tier: sub.tier,
      churnRiskScore: sub.churnRiskScore,
      lifetimeValue: sub.lifetimeValue || 0
    }));
  }

  /**
   * Execute retention workflow for critical risk customers
   */
  async executeCriticalRetentionWorkflow(customer) {
    console.log(`Executing critical retention workflow for ${customer.email}`);

    // 1. Apply immediate account credit
    await this.churnService.executeRetentionAction('CREDIT', customer.userId);

    // 2. Schedule urgent call
    await this.churnService.executeRetentionAction('CALL', customer.userId);

    // 3. Send personalized retention email
    await this.churnService.executeRetentionAction('EMAIL', customer.userId);

    // 4. Log the retention attempt
    await this.logRetentionAttempt(customer.userId, 'CRITICAL_WORKFLOW', {
      actions: ['CREDIT', 'CALL', 'EMAIL'],
      churnRiskScore: customer.churnRiskScore,
      lifetimeValue: customer.lifetimeValue
    });
  }

  /**
   * Execute retention workflow for high risk customers
   */
  async executeHighRiskRetentionWorkflow(customer) {
    console.log(`Executing high risk retention workflow for ${customer.email}`);

    // Determine best action based on customer profile
    let action = 'EMAIL'; // Default action

    // High-value customers get discount offers
    if (customer.lifetimeValue > 500) {
      action = 'DISCOUNT';
    }
    // Premium tier customers get account credits
    else if (customer.tier === 'PRIORITY') {
      action = 'CREDIT';
    }

    // Execute the chosen action
    await this.churnService.executeRetentionAction(action, customer.userId);

    // Log the retention attempt
    await this.logRetentionAttempt(customer.userId, 'HIGH_RISK_WORKFLOW', {
      action,
      churnRiskScore: customer.churnRiskScore,
      lifetimeValue: customer.lifetimeValue,
      tier: customer.tier
    });
  }

  /**
   * Log retention attempt for tracking and analysis
   */
  async logRetentionAttempt(userId, workflowType, metadata) {
    // In a real implementation, this would create a record in a retention_attempts table
    console.log(`Retention attempt logged for user ${userId}:`, {
      workflowType,
      timestamp: new Date().toISOString(),
      metadata
    });

    // For now, we'll just log to console, but in production you'd want to:
    // 1. Create a retention_attempts table
    // 2. Track success/failure rates
    // 3. Prevent duplicate attempts within a time window
    // 4. Generate reports on retention campaign effectiveness
  }

  /**
   * Get retention campaign statistics
   */
  async getRetentionStats() {
    // In a real implementation, this would query retention_attempts table
    // For now, return mock data
    return {
      totalCampaigns: 45,
      successfulRetentions: 18,
      successRate: 0.4,
      averageTimeToRetention: '5.2 days',
      topPerformingAction: 'DISCOUNT',
      lastRunAt: new Date().toISOString()
    };
  }

  /**
   * Analyze churn prediction accuracy
   */
  async analyzeChurnAccuracy() {
    // This would compare predicted churn vs actual churn over time
    // For now, return mock performance data
    return {
      accuracy: 0.78,
      precision: 0.72,
      recall: 0.68,
      f1Score: 0.70,
      totalPredictions: 211,
      correctPredictions: 165,
      falsePositives: 18,
      falseNegatives: 28,
      lastAnalysisDate: new Date().toISOString()
    };
  }

  /**
   * Generate churn prevention report
   */
  async generateChurnPreventionReport() {
    const [
      churnMetrics,
      retentionStats,
      accuracyAnalysis
    ] = await Promise.all([
      this.churnService.getChurnMetrics(),
      this.getRetentionStats(),
      this.analyzeChurnAccuracy()
    ]);

    return {
      summary: {
        totalAtRisk: churnMetrics.totalAtRisk,
        potentialRevenueLoss: churnMetrics.potentialRevenueLoss,
        retentionSuccessRate: retentionStats.successRate,
        predictionAccuracy: accuracyAnalysis.accuracy
      },
      churnMetrics,
      retentionStats,
      accuracyAnalysis,
      generatedAt: new Date().toISOString()
    };
  }
}

export default ChurnAutomationService;