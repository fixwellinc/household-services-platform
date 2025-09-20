#!/usr/bin/env node

/**
 * Rollback Manager
 * Handles deployment rollbacks with comprehensive safety checks
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class RollbackManager {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '../..');
        this.rollbackDataFile = path.join(this.projectRoot, '.rollback-data.json');
        this.backupDir = path.join(this.projectRoot, 'backups');
        this.logFile = path.join(this.projectRoot, 'logs', `rollback-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`);
        
        this.ensureDirectories();
    }

    ensureDirectories() {
        const dirs = [
            this.backupDir,
            path.dirname(this.logFile)
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${level}: ${message}`;
        
        console.log(logMessage);
        fs.appendFileSync(this.logFile, logMessage + '\n');
    }

    async executeCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            this.log(`Executing: ${command}`);
            
            const child = spawn('sh', ['-c', command], {
                cwd: options.cwd || this.projectRoot,
                stdio: options.silent ? 'pipe' : 'inherit',
                env: { ...process.env, ...options.env }
            });

            let stdout = '';
            let stderr = '';

            if (options.silent) {
                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                child.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
            }

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr, code });
                } else {
                    reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
                }
            });

            child.on('error', reject);
        });
    }

    async promptUser(question) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer.toLowerCase().trim());
            });
        });
    }

    async getRailwayDeployments() {
        this.log('Fetching Railway deployments...');
        
        try {
            const result = await this.executeCommand('railway deployments list --json', { silent: true });
            const deployments = JSON.parse(result.stdout);
            return deployments;
        } catch (error) {
            this.log(`Failed to fetch deployments: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async getCurrentDeployment() {
        try {
            const deployments = await this.getRailwayDeployments();
            return deployments[0]; // Most recent deployment
        } catch (error) {
            this.log(`Failed to get current deployment: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async getPreviousDeployment() {
        try {
            const deployments = await this.getRailwayDeployments();
            if (deployments.length < 2) {
                throw new Error('No previous deployment found');
            }
            return deployments[1]; // Second most recent deployment
        } catch (error) {
            this.log(`Failed to get previous deployment: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async saveRollbackData(deployment) {
        this.log('Saving rollback data...');
        
        const rollbackData = {
            deployment,
            timestamp: new Date().toISOString(),
            version: deployment.meta?.version || 'unknown',
            environment: process.env.RAILWAY_ENVIRONMENT || 'production'
        };
        
        fs.writeFileSync(this.rollbackDataFile, JSON.stringify(rollbackData, null, 2));
        this.log(`Rollback data saved to: ${this.rollbackDataFile}`);
    }

    async loadRollbackData() {
        if (!fs.existsSync(this.rollbackDataFile)) {
            throw new Error('No rollback data found. Cannot determine previous deployment.');
        }
        
        const data = JSON.parse(fs.readFileSync(this.rollbackDataFile, 'utf8'));
        this.log(`Loaded rollback data from: ${this.rollbackDataFile}`);
        return data;
    }

    async createPreRollbackBackup() {
        this.log('Creating pre-rollback backup...');
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const backupFile = path.join(this.backupDir, `pre-rollback-${timestamp}.sql`);
        
        try {
            const databaseUrl = process.env.DATABASE_URL;
            if (!databaseUrl) {
                throw new Error('DATABASE_URL environment variable not set');
            }

            await this.executeCommand(`pg_dump "${databaseUrl}" > "${backupFile}"`, { silent: true });
            await this.executeCommand(`gzip "${backupFile}"`, { silent: true });
            
            const compressedFile = `${backupFile}.gz`;
            this.log(`Pre-rollback backup created: ${compressedFile}`);
            
            return compressedFile;
        } catch (error) {
            this.log(`Failed to create pre-rollback backup: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async rollbackDeployment(deploymentId) {
        this.log(`Rolling back to deployment: ${deploymentId}`);
        
        try {
            await this.executeCommand(`railway rollback ${deploymentId}`);
            this.log('Deployment rollback initiated');
            
            // Wait for rollback to complete
            await this.waitForDeploymentReady();
            
            this.log('Deployment rollback completed');
            return true;
        } catch (error) {
            this.log(`Deployment rollback failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async waitForDeploymentReady(maxWaitTime = 300) {
        this.log('Waiting for deployment to be ready...');
        
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime * 1000) {
            try {
                const result = await this.executeCommand('railway status', { silent: true });
                
                if (result.stdout.includes('RUNNING')) {
                    this.log('Deployment is ready');
                    return true;
                }
                
                this.log('Waiting for deployment...');
                await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
                
            } catch (error) {
                this.log(`Error checking deployment status: ${error.message}`, 'WARNING');
            }
        }
        
        throw new Error('Deployment did not become ready within the timeout period');
    }

    async runHealthChecks() {
        this.log('Running post-rollback health checks...');
        
        try {
            // Get application URL
            const result = await this.executeCommand('railway domain', { silent: true });
            const appUrl = result.stdout.trim();
            
            if (!appUrl) {
                throw new Error('Could not determine application URL');
            }
            
            // Test critical endpoints
            const endpoints = ['/health', '/api/health', '/api/auth/status'];
            
            for (const endpoint of endpoints) {
                this.log(`Testing endpoint: ${endpoint}`);
                
                try {
                    await this.executeCommand(`curl -f "${appUrl}${endpoint}"`, { silent: true });
                    this.log(`✓ ${endpoint} is responding`);
                } catch (error) {
                    this.log(`✗ ${endpoint} failed health check`, 'ERROR');
                    throw new Error(`Health check failed for ${endpoint}`);
                }
            }
            
            // Test database connectivity
            this.log('Testing database connectivity...');
            await this.executeCommand('railway run --service backend "npx prisma db pull"', { 
                silent: true,
                cwd: path.join(this.projectRoot, 'apps/backend')
            });
            this.log('✓ Database connectivity verified');
            
            this.log('All health checks passed');
            return true;
            
        } catch (error) {
            this.log(`Health checks failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async restoreDatabaseBackup(backupFile) {
        this.log(`Restoring database from backup: ${backupFile}`);
        
        if (!fs.existsSync(backupFile)) {
            throw new Error(`Backup file not found: ${backupFile}`);
        }
        
        try {
            // Decompress if needed
            let sqlFile = backupFile;
            if (backupFile.endsWith('.gz')) {
                sqlFile = backupFile.replace('.gz', '');
                await this.executeCommand(`gunzip -c "${backupFile}" > "${sqlFile}"`, { silent: true });
            }
            
            // Restore database
            const databaseUrl = process.env.DATABASE_URL;
            await this.executeCommand(`psql "${databaseUrl}" < "${sqlFile}"`, { silent: true });
            
            // Clean up decompressed file if we created it
            if (backupFile.endsWith('.gz')) {
                fs.unlinkSync(sqlFile);
            }
            
            this.log('Database restored successfully');
            return true;
        } catch (error) {
            this.log(`Database restore failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async performFullRollback(options = {}) {
        this.log('Starting full rollback process...');
        
        try {
            // Get previous deployment
            let targetDeployment;
            
            if (options.deploymentId) {
                // Use specified deployment ID
                const deployments = await this.getRailwayDeployments();
                targetDeployment = deployments.find(d => d.id === options.deploymentId);
                
                if (!targetDeployment) {
                    throw new Error(`Deployment not found: ${options.deploymentId}`);
                }
            } else {
                // Use previous deployment
                targetDeployment = await this.getPreviousDeployment();
            }
            
            this.log(`Target deployment: ${targetDeployment.id} (${targetDeployment.meta?.version || 'unknown version'})`);
            
            // Confirm with user in interactive mode
            if (process.stdin.isTTY && !options.force) {
                const answer = await this.promptUser(`Rollback to deployment ${targetDeployment.id}? (y/N): `);
                if (answer !== 'y' && answer !== 'yes') {
                    this.log('Rollback cancelled by user');
                    return false;
                }
            }
            
            // Create pre-rollback backup
            const backupFile = await this.createPreRollbackBackup();
            
            // Save current deployment info for potential re-rollback
            const currentDeployment = await this.getCurrentDeployment();
            await this.saveRollbackData(currentDeployment);
            
            try {
                // Perform deployment rollback
                await this.rollbackDeployment(targetDeployment.id);
                
                // Restore database backup if specified
                if (options.databaseBackup) {
                    await this.restoreDatabaseBackup(options.databaseBackup);
                }
                
                // Run health checks
                await this.runHealthChecks();
                
                this.log('Full rollback completed successfully');
                
                // Show summary
                this.showRollbackSummary(targetDeployment, backupFile);
                
                return true;
                
            } catch (rollbackError) {
                this.log('Rollback failed, attempting to restore original state...', 'ERROR');
                
                try {
                    // Try to rollback to the original deployment
                    await this.rollbackDeployment(currentDeployment.id);
                    this.log('Original deployment restored');
                } catch (restoreError) {
                    this.log(`Failed to restore original deployment: ${restoreError.message}`, 'ERROR');
                    this.log('CRITICAL: System may be in an inconsistent state!', 'ERROR');
                }
                
                throw rollbackError;
            }
            
        } catch (error) {
            this.log(`Full rollback failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    showRollbackSummary(deployment, backupFile) {
        const appUrl = execSync('railway domain', { encoding: 'utf8' }).trim();
        
        console.log('\n🔄 Rollback Summary');
        console.log('==================');
        console.log(`Rolled back to: ${deployment.id}`);
        console.log(`Version: ${deployment.meta?.version || 'unknown'}`);
        console.log(`Application URL: ${appUrl}`);
        console.log(`Pre-rollback backup: ${backupFile}`);
        console.log(`Log file: ${this.logFile}`);
        console.log('\n✅ Rollback completed successfully');
    }

    async listAvailableDeployments() {
        this.log('Listing available deployments...');
        
        try {
            const deployments = await this.getRailwayDeployments();
            
            console.log('\nAvailable Deployments:');
            console.log('======================');
            
            deployments.slice(0, 10).forEach((deployment, index) => {
                const status = index === 0 ? '(current)' : '';
                const version = deployment.meta?.version || 'unknown';
                const date = new Date(deployment.createdAt).toLocaleString();
                
                console.log(`${deployment.id} - ${version} - ${date} ${status}`);
            });
            
            return deployments;
        } catch (error) {
            this.log(`Failed to list deployments: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async listBackups() {
        this.log('Listing available backups...');
        
        try {
            const backupFiles = fs.readdirSync(this.backupDir)
                .filter(file => file.endsWith('.sql.gz'))
                .sort()
                .reverse();
            
            console.log('\nAvailable Backups:');
            console.log('==================');
            
            backupFiles.forEach(file => {
                const filePath = path.join(this.backupDir, file);
                const stats = fs.statSync(filePath);
                const size = (stats.size / 1024 / 1024).toFixed(2);
                
                console.log(`${file} - ${size}MB - ${stats.mtime.toLocaleString()}`);
            });
            
            return backupFiles;
        } catch (error) {
            this.log(`Failed to list backups: ${error.message}`, 'ERROR');
            throw error;
        }
    }
}

// CLI interface
async function main() {
    const manager = new RollbackManager();
    const command = process.argv[2];

    try {
        switch (command) {
            case 'rollback':
                const deploymentId = process.argv[3];
                const databaseBackup = process.argv[4];
                
                await manager.performFullRollback({
                    deploymentId,
                    databaseBackup,
                    force: process.argv.includes('--force')
                });
                break;
            
            case 'list-deployments':
                await manager.listAvailableDeployments();
                break;
            
            case 'list-backups':
                await manager.listBackups();
                break;
            
            case 'health-check':
                await manager.runHealthChecks();
                break;
            
            default:
                console.log('Usage: node rollback-manager.js <command>');
                console.log('');
                console.log('Commands:');
                console.log('  rollback [deployment-id] [database-backup] - Rollback to previous or specified deployment');
                console.log('  list-deployments                           - List available deployments');
                console.log('  list-backups                              - List available database backups');
                console.log('  health-check                              - Run health checks on current deployment');
                console.log('');
                console.log('Options:');
                console.log('  --force                                   - Skip confirmation prompts');
                process.exit(1);
        }
        
        console.log('Operation completed successfully');
    } catch (error) {
        console.error(`Operation failed: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = RollbackManager;