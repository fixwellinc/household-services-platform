#!/usr/bin/env node

/**
 * Process Monitor for Railway Deployment
 * Monitors memory usage and prevents crashes
 */

const fs = require('fs');

class ProcessMonitor {
  constructor() {
    this.memoryThreshold = 450; // MB (Railway has 512MB limit)
    this.checkInterval = 60000; // 1 minute
    this.logFile = '/tmp/process-monitor.log';
    this.startTime = Date.now();
  }

  start() {
    console.log('🔍 Starting process monitor...');
    
    // Monitor memory usage
    setInterval(() => {
      this.checkMemoryUsage();
    }, this.checkInterval);
    
    // Monitor for unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.log(`❌ Unhandled Rejection: ${reason}`);
    });
    
    // Monitor for uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.log(`❌ Uncaught Exception: ${error.message}`);
    });
    
    console.log('✅ Process monitor started');
  }

  checkMemoryUsage() {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);
    
    const uptime = Math.round((Date.now() - this.startTime) / 1000 / 60); // minutes
    
    if (heapUsedMB > this.memoryThreshold) {
      this.log(`⚠️  High memory usage: ${heapUsedMB}MB (threshold: ${this.memoryThreshold}MB)`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        const newUsage = process.memoryUsage();
        const newHeapUsedMB = Math.round(newUsage.heapUsed / 1024 / 1024);
        this.log(`🧹 Garbage collection: ${heapUsedMB}MB -> ${newHeapUsedMB}MB`);
      }
    }
    
    // Log memory stats every 15 minutes
    if (uptime % 15 === 0) {
      this.log(`📊 Memory stats - Heap: ${heapUsedMB}/${heapTotalMB}MB, RSS: ${rssMB}MB, Uptime: ${uptime}min`);
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    console.log(logMessage);
    
    try {
      fs.appendFileSync(this.logFile, logMessage + '\n');
    } catch (error) {
      // Ignore file write errors
    }
  }
}

// Start monitoring if this script is run directly
if (require.main === module) {
  const monitor = new ProcessMonitor();
  monitor.start();
}

module.exports = ProcessMonitor;
