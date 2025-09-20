#!/usr/bin/env node

/**
 * Database Migration Manager
 * Handles production database migrations with safety checks and rollback capabilities
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class MigrationManager {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '../..');
        this.backendPath = path.join(this.projectRoot, 'apps/backend');
        this.backupDir = path.join(this.projectRoot, 'backups/migrations');
        this.logFile = path.join(this.projectRoot, 'logs', `migration-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`);
        
        // Ensure directories exist
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
                cwd: options.cwd || this.backendPath,
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

    async checkDatabaseConnection() {
        this.log('Checking database connection...');
        
        try {
            await this.executeCommand('npx prisma db pull --force', { silent: true });
            this.log('Database connection successful');
            return true;
        } catch (error) {
            this.log(`Database connection failed: ${error.message}`, 'ERROR');
            return false;
        }
    }

    async createBackup() {
        this.log('Creating database backup...');
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const backupFile = path.join(this.backupDir, `backup-${timestamp}.sql`);
        
        try {
            // Create backup using pg_dump
            const databaseUrl = process.env.DATABASE_URL;
            if (!databaseUrl) {
                throw new Error('DATABASE_URL environment variable not set');
            }

            await this.executeCommand(`pg_dump "${databaseUrl}" > "${backupFile}"`, { silent: true });
            
            // Compress backup
            await this.executeCommand(`gzip "${backupFile}"`, { silent: true });
            
            const compressedFile = `${backupFile}.gz`;
            this.log(`Backup created: ${compressedFile}`);
            
            return compressedFile;
        } catch (error) {
            this.log(`Backup creation failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async getMigrationStatus() {
        this.log('Checking migration status...');
        
        try {
            const result = await this.executeCommand('npx prisma migrate status', { silent: true });
            return result.stdout;
        } catch (error) {
            this.log(`Failed to get migration status: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async getPendingMigrations() {
        try {
            const status = await this.getMigrationStatus();
            
            // Parse migration status to find pending migrations
            const lines = status.split('\n');
            const pendingMigrations = [];
            
            let inPendingSection = false;
            for (const line of lines) {
                if (line.includes('Following migration(s) have not been applied yet:')) {
                    inPendingSection = true;
                    continue;
                }
                
                if (inPendingSection && line.trim().startsWith('└─')) {
                    const migrationName = line.trim().replace('└─ ', '').replace('├─ ', '');
                    if (migrationName) {
                        pendingMigrations.push(migrationName);
                    }
                }
                
                if (inPendingSection && line.trim() === '') {
                    break;
                }
            }
            
            return pendingMigrations;
        } catch (error) {
            this.log(`Failed to get pending migrations: ${error.message}`, 'ERROR');
            return [];
        }
    }

    async runMigrations() {
        this.log('Running database migrations...');
        
        try {
            // Generate Prisma client first
            await this.executeCommand('npx prisma generate');
            
            // Run migrations
            await this.executeCommand('npx prisma migrate deploy');
            
            this.log('Migrations completed successfully');
            return true;
        } catch (error) {
            this.log(`Migration failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async verifyMigrations() {
        this.log('Verifying migration completion...');
        
        try {
            const status = await this.getMigrationStatus();
            
            if (status.includes('Database schema is up to date!')) {
                this.log('All migrations applied successfully');
                return true;
            } else {
                this.log('Some migrations may not have been applied', 'WARNING');
                this.log(status);
                return false;
            }
        } catch (error) {
            this.log(`Migration verification failed: ${error.message}`, 'ERROR');
            return false;
        }
    }

    async restoreBackup(backupFile) {
        this.log(`Restoring database from backup: ${backupFile}`);
        
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

    async runSafeMigration() {
        this.log('Starting safe migration process...');
        
        try {
            // Check database connection
            if (!(await this.checkDatabaseConnection())) {
                throw new Error('Cannot connect to database');
            }

            // Get pending migrations
            const pendingMigrations = await this.getPendingMigrations();
            
            if (pendingMigrations.length === 0) {
                this.log('No pending migrations found');
                return true;
            }

            this.log(`Found ${pendingMigrations.length} pending migration(s):`);
            pendingMigrations.forEach(migration => {
                this.log(`  - ${migration}`);
            });

            // Confirm with user in interactive mode
            if (process.stdin.isTTY) {
                const answer = await this.promptUser('Do you want to proceed with these migrations? (y/N): ');
                if (answer !== 'y' && answer !== 'yes') {
                    this.log('Migration cancelled by user');
                    return false;
                }
            }

            // Create backup
            const backupFile = await this.createBackup();

            try {
                // Run migrations
                await this.runMigrations();

                // Verify migrations
                const verified = await this.verifyMigrations();
                
                if (!verified) {
                    throw new Error('Migration verification failed');
                }

                this.log('Safe migration completed successfully');
                return true;

            } catch (migrationError) {
                this.log('Migration failed, attempting to restore backup...', 'ERROR');
                
                try {
                    await this.restoreBackup(backupFile);
                    this.log('Database restored to previous state');
                } catch (restoreError) {
                    this.log(`Failed to restore backup: ${restoreError.message}`, 'ERROR');
                    this.log('CRITICAL: Database may be in an inconsistent state!', 'ERROR');
                }
                
                throw migrationError;
            }

        } catch (error) {
            this.log(`Safe migration failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async rollbackMigration(migrationName) {
        this.log(`Rolling back migration: ${migrationName}`);
        
        try {
            // Create backup before rollback
            const backupFile = await this.createBackup();
            
            // Prisma doesn't support automatic rollbacks, so we need to handle this manually
            this.log('Note: Prisma does not support automatic migration rollbacks');
            this.log('You may need to manually create a new migration to undo changes');
            this.log(`Backup created at: ${backupFile}`);
            
            return true;
        } catch (error) {
            this.log(`Rollback failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async listMigrations() {
        this.log('Listing all migrations...');
        
        try {
            const status = await this.getMigrationStatus();
            console.log(status);
            return true;
        } catch (error) {
            this.log(`Failed to list migrations: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async resetDatabase() {
        this.log('Resetting database...');
        
        if (process.stdin.isTTY) {
            const answer = await this.promptUser('This will delete all data! Are you sure? (y/N): ');
            if (answer !== 'y' && answer !== 'yes') {
                this.log('Database reset cancelled');
                return false;
            }
        }

        try {
            // Create backup first
            const backupFile = await this.createBackup();
            this.log(`Backup created: ${backupFile}`);

            // Reset database
            await this.executeCommand('npx prisma migrate reset --force');
            
            this.log('Database reset completed');
            return true;
        } catch (error) {
            this.log(`Database reset failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }
}

// CLI interface
async function main() {
    const manager = new MigrationManager();
    const command = process.argv[2];

    try {
        switch (command) {
            case 'migrate':
                await manager.runSafeMigration();
                break;
            
            case 'status':
                await manager.listMigrations();
                break;
            
            case 'backup':
                const backupFile = await manager.createBackup();
                console.log(`Backup created: ${backupFile}`);
                break;
            
            case 'restore':
                const restoreFile = process.argv[3];
                if (!restoreFile) {
                    console.error('Please specify backup file to restore');
                    process.exit(1);
                }
                await manager.restoreBackup(restoreFile);
                break;
            
            case 'rollback':
                const migrationName = process.argv[3];
                if (!migrationName) {
                    console.error('Please specify migration name to rollback');
                    process.exit(1);
                }
                await manager.rollbackMigration(migrationName);
                break;
            
            case 'reset':
                await manager.resetDatabase();
                break;
            
            default:
                console.log('Usage: node migration-manager.js <command>');
                console.log('');
                console.log('Commands:');
                console.log('  migrate   - Run pending migrations safely');
                console.log('  status    - Show migration status');
                console.log('  backup    - Create database backup');
                console.log('  restore   - Restore from backup file');
                console.log('  rollback  - Rollback specific migration');
                console.log('  reset     - Reset database (destructive)');
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

module.exports = MigrationManager;