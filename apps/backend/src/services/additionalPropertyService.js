import prisma from '../config/database.js';
import { getPlanByTier } from '../config/plans.js';

/**
 * AdditionalPropertyService handles management of additional properties for subscriptions
 * Allows subscribers to add multiple properties under one subscription plan
 */
class AdditionalPropertyService {
  constructor() {
    // Additional property pricing is 50% of base plan price
    this.ADDITIONAL_PROPERTY_DISCOUNT = 0.5;
    
    // Maximum number of additional properties allowed per subscription
    this.MAX_ADDITIONAL_PROPERTIES = 5;
    
    // Supported verification document types
    this.SUPPORTED_DOCUMENT_TYPES = [
      'deed',
      'mortgage_statement',
      'property_tax_bill',
      'utility_bill',
      'lease_agreement',
      'property_insurance'
    ];
  }

  /**
   * Add an additional property to a subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} propertyData - Property information
   * @returns {Object} Added property details
   */
  async addProperty(subscriptionId, propertyData) {
    try {
      const { address, nickname, ownershipVerification } = propertyData;

      // Validate inputs
      if (!subscriptionId || !address) {
        throw new Error('Subscription ID and address are required');
      }

      // Get subscription with existing properties
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
          additionalProperties: true,
          user: true
        }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Check if subscription is active
      if (subscription.status !== 'ACTIVE') {
        throw new Error('Can only add properties to active subscriptions');
      }

      // Check maximum properties limit
      if (subscription.additionalProperties.length >= this.MAX_ADDITIONAL_PROPERTIES) {
        throw new Error(`Maximum ${this.MAX_ADDITIONAL_PROPERTIES} additional properties allowed`);
      }

      // Check for duplicate addresses
      const existingProperty = subscription.additionalProperties.find(
        prop => prop.address.toLowerCase() === address.toLowerCase()
      );

      if (existingProperty) {
        throw new Error('Property address already exists in this subscription');
      }

      // Validate address format (basic validation)
      if (!this.validateAddress(address)) {
        throw new Error('Invalid address format');
      }

      // Calculate monthly fee (50% of base plan price)
      const monthlyFee = this.calculateAdditionalPropertyFee(subscription.tier);

      // Create property record
      const property = await prisma.additionalProperty.create({
        data: {
          subscriptionId,
          address: address.trim(),
          nickname: nickname?.trim() || null,
          monthlyFee,
          ownershipVerified: false, // Will be verified separately
          verificationDocument: ownershipVerification?.documentUrl || null
        }
      });

      // If ownership verification document is provided, process it
      if (ownershipVerification) {
        await this.processOwnershipVerification(property.id, ownershipVerification);
      }

      // Update subscription's next payment amount to include new property
      await this.updateSubscriptionPricing(subscriptionId);

      return {
        id: property.id,
        address: property.address,
        nickname: property.nickname,
        monthlyFee: property.monthlyFee,
        ownershipVerified: property.ownershipVerified,
        addedAt: property.addedAt,
        message: 'Property added successfully'
      };

    } catch (error) {
      console.error('Error adding property:', error);
      throw error;
    }
  }

  /**
   * Remove an additional property from a subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {string} propertyId - The property ID to remove
   * @returns {Object} Removal confirmation
   */
  async removeProperty(subscriptionId, propertyId) {
    try {
      // Validate inputs
      if (!subscriptionId || !propertyId) {
        throw new Error('Subscription ID and property ID are required');
      }

      // Get property with subscription details
      const property = await prisma.additionalProperty.findUnique({
        where: { id: propertyId },
        include: {
          subscription: true
        }
      });

      if (!property) {
        throw new Error('Property not found');
      }

      // Verify property belongs to the subscription
      if (property.subscriptionId !== subscriptionId) {
        throw new Error('Property does not belong to this subscription');
      }

      // Check for active service appointments at this property
      const activeBookings = await this.checkActiveBookingsForProperty(propertyId);
      if (activeBookings > 0) {
        throw new Error('Cannot remove property with active service appointments. Please complete or reschedule pending services first.');
      }

      // Remove the property
      await prisma.additionalProperty.delete({
        where: { id: propertyId }
      });

      // Update subscription pricing
      await this.updateSubscriptionPricing(subscriptionId);

      return {
        propertyId,
        address: property.address,
        monthlyFee: property.monthlyFee,
        message: 'Property removed successfully'
      };

    } catch (error) {
      console.error('Error removing property:', error);
      throw error;
    }
  }

  /**
   * Update property details (nickname, preferences)
   * @param {string} propertyId - The property ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated property details
   */
  async updateProperty(propertyId, updateData) {
    try {
      const { nickname, preferences } = updateData;

      // Validate inputs
      if (!propertyId) {
        throw new Error('Property ID is required');
      }

      // Get existing property
      const existingProperty = await prisma.additionalProperty.findUnique({
        where: { id: propertyId }
      });

      if (!existingProperty) {
        throw new Error('Property not found');
      }

      // Prepare update data
      const updateFields = {};
      
      if (nickname !== undefined) {
        updateFields.nickname = nickname?.trim() || null;
      }

      // Note: Preferences would be stored in a separate table or JSON field
      // For now, we'll focus on nickname updates as per the schema

      // Update property
      const updatedProperty = await prisma.additionalProperty.update({
        where: { id: propertyId },
        data: updateFields
      });

      return {
        id: updatedProperty.id,
        address: updatedProperty.address,
        nickname: updatedProperty.nickname,
        monthlyFee: updatedProperty.monthlyFee,
        ownershipVerified: updatedProperty.ownershipVerified,
        message: 'Property updated successfully'
      };

    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  }

  /**
   * Get all properties for a subscription
   * @param {string} subscriptionId - The subscription ID
   * @returns {Array} List of properties
   */
  async getPropertiesForSubscription(subscriptionId) {
    try {
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

      const properties = await prisma.additionalProperty.findMany({
        where: { subscriptionId },
        orderBy: { addedAt: 'asc' }
      });

      return properties.map(property => ({
        id: property.id,
        address: property.address,
        nickname: property.nickname,
        monthlyFee: property.monthlyFee,
        ownershipVerified: property.ownershipVerified,
        addedAt: property.addedAt,
        displayName: property.nickname || property.address
      }));

    } catch (error) {
      console.error('Error getting properties for subscription:', error);
      throw error;
    }
  }

  /**
   * Calculate additional property fee (50% of base plan price)
   * @param {string} planTier - The subscription tier
   * @returns {number} Monthly fee for additional property
   */
  calculateAdditionalPropertyFee(planTier) {
    try {
      const plan = getPlanByTier(planTier);
      if (!plan) {
        throw new Error(`Invalid plan tier: ${planTier}`);
      }

      // Additional properties cost 50% of the base monthly plan price
      const additionalPropertyFee = plan.monthlyPrice * this.ADDITIONAL_PROPERTY_DISCOUNT;
      
      return Math.round(additionalPropertyFee * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Error calculating additional property fee:', error);
      throw error;
    }
  }

  /**
   * Calculate total additional properties cost for a subscription
   * @param {string} subscriptionId - The subscription ID
   * @returns {Object} Cost breakdown
   */
  async calculateTotalAdditionalPropertiesCost(subscriptionId) {
    try {
      const properties = await this.getPropertiesForSubscription(subscriptionId);
      
      const totalMonthlyFee = properties.reduce((sum, property) => sum + property.monthlyFee, 0);
      const propertyCount = properties.length;

      return {
        propertyCount,
        totalMonthlyFee: Math.round(totalMonthlyFee * 100) / 100,
        properties: properties.map(prop => ({
          id: prop.id,
          address: prop.address,
          nickname: prop.nickname,
          monthlyFee: prop.monthlyFee
        }))
      };

    } catch (error) {
      console.error('Error calculating total additional properties cost:', error);
      throw error;
    }
  }

  /**
   * Validate address format (basic validation)
   * @param {string} address - Address to validate
   * @returns {boolean} Whether address is valid
   */
  validateAddress(address) {
    if (!address || typeof address !== 'string') {
      return false;
    }

    const trimmedAddress = address.trim();
    
    // Basic validation: address should have at least 10 characters and contain numbers
    if (trimmedAddress.length < 10) {
      return false;
    }

    // Should contain at least one number (street number)
    if (!/\d/.test(trimmedAddress)) {
      return false;
    }

    // Should not be just numbers
    if (/^\d+$/.test(trimmedAddress)) {
      return false;
    }

    return true;
  }

  /**
   * Process ownership verification document
   * @param {string} propertyId - The property ID
   * @param {Object} verificationData - Verification document data
   * @returns {Object} Verification result
   */
  async processOwnershipVerification(propertyId, verificationData) {
    try {
      const { documentType, documentUrl, notes } = verificationData;

      // Validate document type
      if (!this.SUPPORTED_DOCUMENT_TYPES.includes(documentType)) {
        throw new Error(`Unsupported document type: ${documentType}`);
      }

      // In a real implementation, this would:
      // 1. Validate the document URL/file
      // 2. Perform OCR or manual review
      // 3. Verify property ownership details
      // 4. Update verification status

      // For now, we'll mark as pending verification
      await prisma.additionalProperty.update({
        where: { id: propertyId },
        data: {
          verificationDocument: documentUrl,
          // In a real system, you'd have additional fields for verification status
        }
      });

      return {
        propertyId,
        documentType,
        status: 'pending_verification',
        message: 'Ownership verification document submitted for review'
      };

    } catch (error) {
      console.error('Error processing ownership verification:', error);
      throw error;
    }
  }

  /**
   * Update subscription pricing to include additional properties
   * @param {string} subscriptionId - The subscription ID
   */
  async updateSubscriptionPricing(subscriptionId) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { additionalProperties: true }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Calculate base plan price
      const plan = getPlanByTier(subscription.tier);
      const basePlanPrice = subscription.paymentFrequency === 'YEARLY' 
        ? plan.yearlyPrice 
        : plan.monthlyPrice;

      // Calculate additional properties cost
      const additionalPropertiesCost = subscription.additionalProperties.reduce(
        (sum, property) => sum + property.monthlyFee, 0
      );

      // For yearly subscriptions, multiply additional properties cost by 12
      const totalAdditionalCost = subscription.paymentFrequency === 'YEARLY'
        ? additionalPropertiesCost * 12
        : additionalPropertiesCost;

      const totalAmount = basePlanPrice + totalAdditionalCost;

      // Update subscription with new payment amount
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          nextPaymentAmount: Math.round(totalAmount * 100) / 100
        }
      });

    } catch (error) {
      console.error('Error updating subscription pricing:', error);
      throw error;
    }
  }

  /**
   * Check for active bookings at a property
   * @param {string} propertyId - The property ID
   * @returns {number} Number of active bookings
   */
  async checkActiveBookingsForProperty(propertyId) {
    try {
      // This would need to be implemented based on how bookings are linked to properties
      // For now, return 0 as the booking system doesn't currently track property-specific bookings
      
      // In a full implementation, you would:
      // 1. Check if bookings table has a propertyId field
      // 2. Count bookings with status 'PENDING' or 'CONFIRMED'
      // 3. Filter by future scheduled dates
      
      return 0;
    } catch (error) {
      console.error('Error checking active bookings for property:', error);
      return 0;
    }
  }

  /**
   * Validate property management eligibility
   * @param {string} subscriptionId - The subscription ID
   * @returns {Object} Eligibility status
   */
  async validatePropertyManagementEligibility(subscriptionId) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
          additionalProperties: true,
          user: true
        }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const eligibilityChecks = {
        subscriptionActive: subscription.status === 'ACTIVE',
        notPaused: !subscription.isPaused,
        belowMaxProperties: subscription.additionalProperties.length < this.MAX_ADDITIONAL_PROPERTIES,
        accountInGoodStanding: subscription.status !== 'SUSPENDED'
      };

      const isEligible = Object.values(eligibilityChecks).every(check => check);

      return {
        eligible: isEligible,
        checks: eligibilityChecks,
        currentPropertyCount: subscription.additionalProperties.length,
        maxProperties: this.MAX_ADDITIONAL_PROPERTIES,
        remainingSlots: this.MAX_ADDITIONAL_PROPERTIES - subscription.additionalProperties.length
      };

    } catch (error) {
      console.error('Error validating property management eligibility:', error);
      throw error;
    }
  }

  /**
   * Get property management statistics
   * @returns {Object} Statistics about property management
   */
  async getPropertyManagementStatistics() {
    try {
      const totalProperties = await prisma.additionalProperty.count();
      const verifiedProperties = await prisma.additionalProperty.count({
        where: { ownershipVerified: true }
      });
      
      const subscriptionsWithProperties = await prisma.subscription.count({
        where: {
          additionalProperties: {
            some: {}
          }
        }
      });

      const averagePropertiesPerSubscription = subscriptionsWithProperties > 0 
        ? totalProperties / subscriptionsWithProperties 
        : 0;

      return {
        totalAdditionalProperties: totalProperties,
        verifiedProperties,
        pendingVerification: totalProperties - verifiedProperties,
        subscriptionsWithProperties,
        averagePropertiesPerSubscription: Math.round(averagePropertiesPerSubscription * 100) / 100,
        verificationRate: totalProperties > 0 ? (verifiedProperties / totalProperties * 100).toFixed(2) : 0
      };

    } catch (error) {
      console.error('Error getting property management statistics:', error);
      throw error;
    }
  }
}

export default new AdditionalPropertyService();