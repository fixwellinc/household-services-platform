#!/usr/bin/env ts-node

/**
 * Example demonstrating the SafetyManager advanced safety features
 */

import { SafetyManager } from '../core/SafetyManager';
import { ChangeExecutor } from '../core/ChangeExecutor';
import { Change } from '../types';

async function demonstrateSafetyFeatures() {
  console.log('🛡️  SafetyManager Advanced Features Demo\n');

  // Create SafetyManager with custom configuration
  const safetyManager = new SafetyManager({
    requireConfirmation: true,
    maxAutoDeleteSize: 1024 * 100, // 100KB
    whitelist: ['temp/**', '**/*.log'],
    blacklist: ['node_modules/**', '.git/**']
  });

  // Example changes to test
  const changes: Change[] = [
    {
      id: 'safe-log-delete',
      type: 'delete_file',
      description: 'Delete temporary log file',
      sourcePath: 'temp/debug.log',
      riskLevel: 'safe',
      autoApplicable: true
    },
    {
      id: 'critical-package-modify',
      type: 'modify_file',
      description: 'Modify package.json',
      sourcePath: 'package.json',
      content: '{"name": "updated"}',
      riskLevel: 'review',
      autoApplicable: false
    },
    {
      id: 'blacklisted-file',
      type: 'delete_file',
      description: 'Delete file in node_modules',
      sourcePath: 'node_modules/some-package/index.js',
      riskLevel: 'safe',
      autoApplicable: true
    }
  ];

  console.log('📋 Testing individual change safety checks:\n');

  for (const change of changes) {
    console.log(`Change: ${change.description}`);
    const result = await safetyManager.checkChangeSafety(change);
    
    console.log(`  ✓ Safe: ${result.safe}`);
    console.log(`  ⚠️  Risk Level: ${result.riskLevel}`);
    console.log(`  📝 Reason: ${result.reason}`);
    console.log(`  🔒 Requires Confirmation: ${result.requiresConfirmation}`);
    
    if (result.suggestion) {
      console.log(`  💡 Suggestion: ${result.suggestion}`);
    }

    // Get safety recommendations
    const recommendations = safetyManager.getSafetyRecommendations(change);
    if (recommendations.length > 0) {
      console.log(`  📋 Recommendations:`);
      recommendations.forEach(rec => console.log(`    - ${rec}`));
    }
    
    console.log('');
  }

  console.log('📊 Testing batch safety check:\n');
  const batchResult = await safetyManager.checkBatchSafety(changes);
  console.log(`Batch Safe: ${batchResult.safe}`);
  console.log(`Batch Risk Level: ${batchResult.riskLevel}`);
  console.log(`Batch Reason: ${batchResult.reason}`);
  console.log('');

  console.log('🔧 Demonstrating whitelist/blacklist management:\n');
  
  // Show current configuration
  const config = safetyManager.getConfig();
  console.log('Current whitelist:', config.whitelist);
  console.log('Current blacklist:', config.blacklist);
  
  // Add new patterns
  safetyManager.addToWhitelist(['src/test/**', '**/*.spec.ts']);
  safetyManager.addToBlacklist(['dist/**', 'build/**']);
  
  console.log('\nAfter adding patterns:');
  const updatedConfig = safetyManager.getConfig();
  console.log('Updated whitelist:', updatedConfig.whitelist);
  console.log('Updated blacklist:', updatedConfig.blacklist);
  
  // Remove patterns
  safetyManager.removeFromWhitelist(['temp/**']);
  safetyManager.removeFromBlacklist(['node_modules/**']);
  
  console.log('\nAfter removing patterns:');
  const finalConfig = safetyManager.getConfig();
  console.log('Final whitelist:', finalConfig.whitelist);
  console.log('Final blacklist:', finalConfig.blacklist);

  console.log('\n🚀 Demonstrating ChangeExecutor integration:\n');
  
  // Create ChangeExecutor with safety configuration
  const executor = new ChangeExecutor('.safety-demo-backups', {
    whitelist: ['**/*.log', 'temp/**'],
    blacklist: ['package.json', 'tsconfig.json'],
    requireConfirmation: false // For demo purposes
  });

  // Test safe change
  const safeChange: Change = {
    id: 'demo-safe-change',
    type: 'delete_file',
    description: 'Delete demo log file',
    sourcePath: 'demo.log',
    riskLevel: 'safe',
    autoApplicable: true
  };

  console.log('Testing safe change execution:');
  const safetyCheck = await executor.checkChangeSafety(safeChange);
  console.log(`  Safety Check Result: ${safetyCheck.safe ? 'PASS' : 'FAIL'}`);
  console.log(`  Reason: ${safetyCheck.reason}`);

  // Get safety recommendations
  const safeRecommendations = executor.getSafetyRecommendations(safeChange);
  if (safeRecommendations.length > 0) {
    console.log('  Recommendations:');
    safeRecommendations.forEach(rec => console.log(`    - ${rec}`));
  }

  console.log('\n✅ SafetyManager demo complete!');
  console.log('\nKey Features Demonstrated:');
  console.log('  ✓ Critical file protection');
  console.log('  ✓ Whitelist/blacklist functionality');
  console.log('  ✓ Risk level assessment');
  console.log('  ✓ Safety recommendations');
  console.log('  ✓ Batch safety checking');
  console.log('  ✓ ChangeExecutor integration');
}

// Run the demo
if (require.main === module) {
  demonstrateSafetyFeatures().catch(console.error);
}

export { demonstrateSafetyFeatures };