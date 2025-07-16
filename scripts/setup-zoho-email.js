#!/usr/bin/env node

/**
 * Zoho Email Setup Script
 * 
 * This script helps you configure Zoho email settings for your Fixwell Services application.
 * Run this script to set up your environment variables and test the email configuration.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupZohoEmail() {
  console.log('🔧 Zoho Email Setup for Fixwell Services');
  console.log('==========================================\n');

  try {
    // Get Zoho email details
    const zohoEmail = await question('Enter your Zoho email address (e.g., yourname@zoho.com): ');
    const zohoPassword = await question('Enter your Zoho password or app-specific password: ');
    
    const useSSL = await question('Use SSL/TLS? (y/n, default: n for port 587): ');
    const smtpPort = useSSL.toLowerCase() === 'y' ? '465' : '587';
    const smtpSecure = useSSL.toLowerCase() === 'y' ? 'true' : 'false';

    // Create environment configuration
    const envConfig = `# Zoho Email Configuration
SMTP_HOST="smtp.zoho.com"
SMTP_PORT=${smtpPort}
SMTP_USER="${zohoEmail}"
SMTP_PASS="${zohoPassword}"
SMTP_SECURE="${smtpSecure}"

# Additional Email Settings
EMAIL_FROM="${zohoEmail}"
EMAIL_REPLY_TO="${zohoEmail}"
`;

    // Write to .env file
    const backendEnvPath = path.join(__dirname, '..', 'apps', 'backend', '.env');
    const frontendEnvPath = path.join(__dirname, '..', 'apps', 'frontend', '.env');

    console.log('\n📝 Writing email configuration...');

    // Update backend .env
    if (fs.existsSync(backendEnvPath)) {
      let backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
      
      // Remove existing SMTP settings
      backendEnv = backendEnv.replace(/SMTP_HOST=.*\n/g, '');
      backendEnv = backendEnv.replace(/SMTP_PORT=.*\n/g, '');
      backendEnv = backendEnv.replace(/SMTP_USER=.*\n/g, '');
      backendEnv = backendEnv.replace(/SMTP_PASS=.*\n/g, '');
      backendEnv = backendEnv.replace(/SMTP_SECURE=.*\n/g, '');
      
      // Add new SMTP settings
      backendEnv += '\n' + envConfig;
      fs.writeFileSync(backendEnvPath, backendEnv);
      console.log('✅ Backend .env updated');
    } else {
      console.log('⚠️  Backend .env file not found. Please create it manually.');
    }

    // Update frontend .env
    if (fs.existsSync(frontendEnvPath)) {
      let frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
      
      // Remove existing SMTP settings
      frontendEnv = frontendEnv.replace(/SMTP_HOST=.*\n/g, '');
      frontendEnv = frontendEnv.replace(/SMTP_PORT=.*\n/g, '');
      frontendEnv = frontendEnv.replace(/SMTP_USER=.*\n/g, '');
      frontendEnv = frontendEnv.replace(/SMTP_PASS=.*\n/g, '');
      
      // Add new SMTP settings
      frontendEnv += '\n' + envConfig;
      fs.writeFileSync(frontendEnvPath, frontendEnv);
      console.log('✅ Frontend .env updated');
    } else {
      console.log('⚠️  Frontend .env file not found. Please create it manually.');
    }

    console.log('\n📋 Configuration Summary:');
    console.log('========================');
    console.log(`SMTP Host: smtp.zoho.com`);
    console.log(`SMTP Port: ${smtpPort}`);
    console.log(`SMTP User: ${zohoEmail}`);
    console.log(`SMTP Secure: ${smtpSecure}`);
    console.log(`From Email: ${zohoEmail}`);

    console.log('\n🔧 Next Steps:');
    console.log('==============');
    console.log('1. Make sure SMTP access is enabled in your Zoho account');
    console.log('2. If you have 2FA enabled, use an app-specific password');
    console.log('3. Start your application: npm run dev');
    console.log('4. Go to /admin → Settings → Email Configuration');
    console.log('5. Test your email configuration');
    console.log('6. Check your email for the test message');

    console.log('\n📚 For detailed instructions, see: ZOHO_EMAIL_SETUP.md');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run the setup
setupZohoEmail(); 