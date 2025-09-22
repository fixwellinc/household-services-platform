import serviceTypeService from '../services/serviceTypeService.js';

const defaultServiceTypes = [
  {
    name: 'general-consultation',
    displayName: 'General Consultation',
    description: 'General home service consultation and assessment',
    duration: 60,
    bufferMinutes: 30,
    color: '#3B82F6',
    maxBookingsPerDay: 8,
    requiresApproval: false,
    isExclusive: false,
    exclusiveDays: [],
    allowedDays: [1, 2, 3, 4, 5], // Monday to Friday
    minAdvanceHours: 24,
    maxAdvanceDays: 30
  },
  {
    name: 'plumbing-assessment',
    displayName: 'Plumbing Assessment',
    description: 'Plumbing system inspection and quote preparation',
    duration: 90,
    bufferMinutes: 45,
    color: '#10B981',
    maxBookingsPerDay: 4,
    requiresApproval: false,
    isExclusive: false,
    exclusiveDays: [],
    allowedDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    minAdvanceHours: 48,
    maxAdvanceDays: 21
  },
  {
    name: 'electrical-assessment',
    displayName: 'Electrical Assessment',
    description: 'Electrical system inspection and safety assessment',
    duration: 120,
    bufferMinutes: 60,
    color: '#F59E0B',
    maxBookingsPerDay: 3,
    requiresApproval: true,
    isExclusive: false,
    exclusiveDays: [],
    allowedDays: [1, 2, 3, 4, 5], // Monday to Friday only
    minAdvanceHours: 72,
    maxAdvanceDays: 14
  },
  {
    name: 'emergency-consultation',
    displayName: 'Emergency Consultation',
    description: 'Urgent home service consultation for emergency situations',
    duration: 45,
    bufferMinutes: 15,
    color: '#EF4444',
    maxBookingsPerDay: 2,
    requiresApproval: true,
    isExclusive: true,
    exclusiveDays: [0, 6], // Exclusive on weekends
    allowedDays: [0, 1, 2, 3, 4, 5, 6], // All days
    minAdvanceHours: 2,
    maxAdvanceDays: 7
  }
];

async function runSeed() {
  console.log('Creating default service types...');
  
  for (const serviceTypeData of defaultServiceTypes) {
    try {
      // Check if service type already exists
      const existing = await serviceTypeService.getServiceTypeByName(serviceTypeData.name);
      if (existing) {
        console.log(`Service type '${serviceTypeData.name}' already exists, skipping...`);
        continue;
      }

      // Create the service type
      const serviceType = await serviceTypeService.createServiceType(serviceTypeData);
      console.log(`✅ Created service type: ${serviceType.displayName}`);
    } catch (error) {
      console.error(`❌ Failed to create service type '${serviceTypeData.name}':`, error.message);
    }
  }
  
  console.log('Service type seeding completed!');
}

runSeed().catch(console.error);