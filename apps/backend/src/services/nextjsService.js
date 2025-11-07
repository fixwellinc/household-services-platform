import { logger } from '../utils/logger.js';
import next from 'next';
import path from 'path';
import fs from 'fs';

/**
 * Next.js Service - Manages Next.js application lifecycle
 */
class NextJSService {
  constructor(options = {}) {
    this.name = 'nextjs';
    this.isReady = false;
    /** @type {any} */
    this.app = null;
    /** @type {Function|null} */
    this.handler = null;
    this.buildCheckFailed = false;
    this.maintenanceMode = false;
    
    // Configuration
    this.frontendDir = options.frontendDir || path.join(process.cwd(), 'apps/frontend');
    this.hostname = options.hostname || process.env.HOSTNAME || '0.0.0.0';
    this.port = options.port || parseInt(process.env.PORT || '3000', 10);
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  async start() {
    logger.info('⚛️ Starting Next.js service...');
    
    try {
      // Check if production build exists
      const buildExists = this._checkProductionBuild();
      const dev = !buildExists;
      
      if (this.isProduction && !buildExists) {
        logger.warn('⚠️ Production build not found, enabling maintenance mode');
        this.maintenanceMode = true;
        this.buildCheckFailed = true;
        return; // Don't throw error, just enable maintenance mode
      }

      logger.info(`📦 Next.js mode: ${dev ? 'development' : 'production'}`);
      logger.info(`📁 Frontend directory: ${this.frontendDir}`);

      // Create Next.js app
      /** @type {any} */
      this.app = next({
        dev,
        hostname: this.hostname,
        port: this.port,
        dir: this.frontendDir,
        customServer: true
      });

      // Prepare the app with timeout
      await this._prepareWithTimeout();
      
      this.handler = this.app.getRequestHandler();
      this.isReady = true;
      this.maintenanceMode = false;
      
      logger.info('✅ Next.js service started successfully');
      
    } catch (error) {
      logger.error('❌ Next.js service startup failed', {
        error: error.message,
        stack: error.stack
      });
      
      // Enable maintenance mode instead of failing completely
      this.maintenanceMode = true;
      this.buildCheckFailed = true;
      
      logger.warn('⚠️ Enabling maintenance mode for Next.js service');
      
      // Don't throw error - this allows the backend to continue running
      return;
    }
  }

  async stop() {
    logger.info('🛑 Stopping Next.js service...');
    
    try {
      if (this.app && this.app.close) {
        await this.app.close();
      }
      
      this.isReady = false;
      this.app = null;
      this.handler = null;
      this.maintenanceMode = false;
      
      logger.info('✅ Next.js service stopped');
    } catch (error) {
      logger.error('❌ Error stopping Next.js service', { error: error.message });
      throw error;
    }
  }

  async getHealth() {
    try {
      if (this.maintenanceMode) {
        return {
          status: 'degraded',
          details: {
            ready: false,
            maintenanceMode: true,
            buildCheckFailed: this.buildCheckFailed,
            message: 'Frontend in maintenance mode - API remains functional'
          }
        };
      }

      if (!this.isReady || !this.handler) {
        return {
          status: 'unhealthy',
          details: {
            ready: false,
            maintenanceMode: false,
            error: 'Next.js not ready'
          }
        };
      }

      return {
        status: 'healthy',
        details: {
          ready: true,
          maintenanceMode: false,
          mode: this.isProduction ? 'production' : 'development',
          frontendDir: this.frontendDir
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          ready: false,
          error: error.message
        }
      };
    }
  }

  /**
   * Handle HTTP requests
   */
  async handleRequest(req, res) {
    if (this.maintenanceMode) {
      return this._serveMaintenancePage(req, res);
    }

    if (!this.isReady || !this.handler) {
      return this._serveMaintenancePage(req, res);
    }

    try {
      await this.handler(req, res);
    } catch (error) {
      logger.error('❌ Next.js request handling error', {
        error: error.message,
        url: req.url,
        method: req.method
      });
      
      // Serve maintenance page on error
      return this._serveMaintenancePage(req, res);
    }
  }

  /**
   * Check if Next.js is ready
   */
  isAvailable() {
    return this.isReady && !this.maintenanceMode;
  }

  /**
   * Check if in maintenance mode
   */
  isInMaintenanceMode() {
    return this.maintenanceMode;
  }

  /**
   * Check if production build exists
   */
  _checkProductionBuild() {
    if (!this.isProduction) {
      logger.info('📦 Development mode - skipping build check');
      return false;
    }

    const nextBuildDir = path.join(this.frontendDir, '.next');
    const buildManifestFile = path.join(nextBuildDir, 'build-manifest.json');
    const serverDir = path.join(nextBuildDir, 'server');
    const staticDir = path.join(nextBuildDir, 'static');

    // Check for critical build artifacts
    const buildManifestExists = fs.existsSync(buildManifestFile);
    const serverDirExists = fs.existsSync(serverDir);
    const staticDirExists = fs.existsSync(staticDir);
    
    // Check for server files
    const serverFilesExist = serverDirExists && (
      fs.existsSync(path.join(serverDir, 'app')) ||
      fs.existsSync(path.join(serverDir, 'pages')) ||
      fs.existsSync(path.join(serverDir, 'middleware.js'))
    );

    const buildExists = buildManifestExists && serverDirExists && serverFilesExist;
    
    logger.info('📦 Production build check:', {
      frontendDir: this.frontendDir,
      buildDir: nextBuildDir,
      buildManifestExists,
      serverDirExists,
      staticDirExists,
      serverFilesExist,
      buildExists: buildExists
    });

    if (!buildExists && this.isProduction) {
      logger.warn('⚠️ Production build artifacts incomplete:', {
        missingBuildManifest: !buildManifestExists,
        missingServerDir: !serverDirExists,
        missingServerFiles: !serverFilesExist,
        missingStaticDir: !staticDirExists
      });
    }

    return buildExists;
  }

  /**
   * Prepare Next.js app with timeout
   */
  async _prepareWithTimeout() {
    // Increase timeout for Railway/production environments
    const timeout = process.env.RAILWAY_ENVIRONMENT ? 120000 : 60000; // 120s for Railway, 60s otherwise
    
    logger.info(`⏱️  Preparing Next.js app (timeout: ${timeout}ms)...`);
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timer = setTimeout(() => {
        const elapsed = Date.now() - startTime;
        reject(new Error(`Next.js preparation timeout after ${elapsed}ms`));
      }, timeout);

      this.app.prepare()
        .then(() => {
          clearTimeout(timer);
          const elapsed = Date.now() - startTime;
          logger.info(`✅ Next.js app prepared successfully in ${elapsed}ms`);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timer);
          const elapsed = Date.now() - startTime;
          logger.error(`❌ Next.js preparation failed after ${elapsed}ms`, {
            error: error.message,
            stack: error.stack
          });
          reject(error);
        });
    });
  }

  /**
   * Serve maintenance page
   */
  _serveMaintenancePage(req, res) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Retry-After', '300'); // Suggest retry after 5 minutes
    
    const maintenanceHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Temporarily Unavailable - Fixwell Services</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 600px;
        }
        .logo {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        .message {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .details {
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 10px;
            margin-bottom: 2rem;
        }
        .api-status {
            background: rgba(34, 197, 94, 0.2);
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 3px solid white;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 1rem auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .retry-info {
            font-size: 0.9rem;
            opacity: 0.8;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🔧 Fixwell Services</div>
        <div class="message">
            We're performing maintenance on our website
        </div>
        <div class="details">
            <div class="spinner"></div>
            <p>Our frontend is temporarily unavailable while we make improvements.</p>
            <div class="api-status">
                ✅ API Services: Fully Operational
            </div>
        </div>
        <div class="retry-info">
            This page will automatically refresh in <span id="countdown">30</span> seconds<br>
            <small>If you're a developer, the API is still accessible at <code>/api/*</code></small>
        </div>
    </div>
    
    <script>
        let countdown = 30;
        const countdownElement = document.getElementById('countdown');
        
        const timer = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(timer);
                window.location.reload();
            }
        }, 1000);
    </script>
</body>
</html>`;

    res.end(maintenanceHtml);
  }
}

export default NextJSService;