import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

/**
 * Maintenance Page Service - Serves maintenance pages when services are unavailable
 */
class MaintenancePageService {
  constructor() {
    this.name = 'maintenance';
    this.templates = new Map();
    this.defaultTemplate = null;
    this.isInitialized = false;
  }

  async start() {
    logger.info('🔧 Starting maintenance page service...');
    
    try {
      this._loadTemplates();
      this.isInitialized = true;
      logger.info('✅ Maintenance page service started successfully');
    } catch (error) {
      logger.error('❌ Maintenance page service startup failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async stop() {
    logger.info('🛑 Stopping maintenance page service...');
    this.templates.clear();
    this.defaultTemplate = null;
    this.isInitialized = false;
    logger.info('✅ Maintenance page service stopped');
  }

  /**
   * Serve maintenance page for frontend failures
   */
  serveFrontendMaintenance(req, res, options = {}) {
    const {
      reason = 'Frontend temporarily unavailable',
      apiStatus = 'operational',
      estimatedTime = '5-10 minutes',
      showApiInfo = true
    } = options;

    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Retry-After', '300'); // Suggest retry after 5 minutes
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    const html = this._generateFrontendMaintenanceHTML({
      reason,
      apiStatus,
      estimatedTime,
      showApiInfo,
      timestamp: new Date().toISOString()
    });

    res.end(html);
  }

  /**
   * Serve maintenance page for API failures
   */
  serveAPIMaintenance(req, res, options = {}) {
    const {
      reason = 'API temporarily unavailable',
      errorCode = 'SERVICE_UNAVAILABLE',
      estimatedTime = '5-10 minutes'
    } = options;

    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Retry-After', '300');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    const response = {
      error: reason,
      code: errorCode,
      status: 503,
      timestamp: new Date().toISOString(),
      estimatedRecovery: estimatedTime,
      retryAfter: 300
    };

    res.end(JSON.stringify(response, null, 2));
  }

  /**
   * Serve general service unavailable page
   */
  serveServiceUnavailable(req, res, options = {}) {
    const {
      serviceName = 'Service',
      reason = 'Service temporarily unavailable',
      showContactInfo = true
    } = options;

    const isApiRequest = req.url && req.url.startsWith('/api');
    
    if (isApiRequest) {
      this.serveAPIMaintenance(req, res, { reason });
    } else {
      this.serveFrontendMaintenance(req, res, { 
        reason: `${serviceName} ${reason}`,
        showApiInfo: false
      });
    }
  }

  /**
   * Generate frontend maintenance HTML
   */
  _generateFrontendMaintenanceHTML(options) {
    const {
      reason,
      apiStatus,
      estimatedTime,
      showApiInfo,
      timestamp
    } = options;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Maintenance - Fixwell Services</title>
    <meta name="robots" content="noindex, nofollow">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            max-width: 600px;
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .logo {
            font-size: 3rem;
            margin-bottom: 20px;
        }
        
        .title {
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 10px;
            color: #ffffff;
        }
        
        .subtitle {
            font-size: 1.1rem;
            margin-bottom: 30px;
            opacity: 0.9;
            line-height: 1.5;
        }
        
        .status-card {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 10px 0;
            padding: 8px 0;
        }
        
        .status-label {
            font-weight: 500;
        }
        
        .status-value {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
        }
        
        .status-operational {
            background-color: #10b981;
        }
        
        .status-maintenance {
            background-color: #f59e0b;
        }
        
        .status-error {
            background-color: #ef4444;
        }
        
        .spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 3px solid white;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .info-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.15);
        }
        
        .info-label {
            font-size: 0.9rem;
            opacity: 0.8;
            margin-bottom: 5px;
        }
        
        .info-value {
            font-weight: 600;
            font-size: 1.1rem;
        }
        
        .countdown {
            font-size: 1.2rem;
            font-weight: 600;
            color: #fbbf24;
            margin: 20px 0;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .api-info {
            background: rgba(16, 185, 129, 0.2);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .api-endpoint {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            background: rgba(0, 0, 0, 0.3);
            padding: 8px 12px;
            border-radius: 4px;
            margin: 8px 0;
            font-size: 0.9rem;
        }
        
        @media (max-width: 600px) {
            .container {
                padding: 30px 20px;
                margin: 10px;
            }
            
            .title {
                font-size: 1.5rem;
            }
            
            .logo {
                font-size: 2rem;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🔧</div>
        <h1 class="title">Fixwell Services</h1>
        <p class="subtitle">${reason}</p>
        
        <div class="spinner"></div>
        
        <div class="status-card">
            <div class="status-item">
                <span class="status-label">Frontend Status</span>
                <span class="status-value">
                    <span class="status-indicator status-maintenance"></span>
                    Under Maintenance
                </span>
            </div>
            ${showApiInfo ? `
            <div class="status-item">
                <span class="status-label">API Status</span>
                <span class="status-value">
                    <span class="status-indicator status-operational"></span>
                    ${apiStatus === 'operational' ? 'Fully Operational' : apiStatus}
                </span>
            </div>
            ` : ''}
        </div>
        
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Estimated Time</div>
                <div class="info-value">${estimatedTime}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Last Updated</div>
                <div class="info-value" id="lastUpdated">${new Date(timestamp).toLocaleTimeString()}</div>
            </div>
        </div>
        
        ${showApiInfo ? `
        <div class="api-info">
            <strong>🔌 API Access Available</strong>
            <p>Developers can still access our API services:</p>
            <div class="api-endpoint">GET ${req?.headers?.host || 'your-domain'}/api/health</div>
            <div class="api-endpoint">POST ${req?.headers?.host || 'your-domain'}/api/*</div>
        </div>
        ` : ''}
        
        <div class="countdown">
            Auto-refresh in <span id="countdown">30</span> seconds
        </div>
        
        <div class="footer">
            <p>We apologize for the inconvenience. Our team is working to restore service.</p>
            <p><small>Incident ID: ${this._generateIncidentId(timestamp)}</small></p>
        </div>
    </div>
    
    <script>
        let countdown = 30;
        const countdownElement = document.getElementById('countdown');
        const lastUpdatedElement = document.getElementById('lastUpdated');
        
        // Update last updated time
        function updateLastUpdated() {
            lastUpdatedElement.textContent = new Date().toLocaleTimeString();
        }
        
        // Countdown timer
        const timer = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(timer);
                window.location.reload();
            }
        }, 1000);
        
        // Update last updated time every 5 seconds
        setInterval(updateLastUpdated, 5000);
        
        // Handle visibility change to pause/resume countdown
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearInterval(timer);
            } else {
                // Reset countdown when page becomes visible again
                countdown = 30;
            }
        });
    </script>
</body>
</html>`;
  }

  /**
   * Load maintenance page templates
   */
  _loadTemplates() {
    // For now, we use the built-in template
    // In the future, templates could be loaded from files
    this.defaultTemplate = 'built-in';
    logger.debug('Maintenance page templates loaded');
  }

  /**
   * Generate incident ID for tracking
   */
  _generateIncidentId(timestamp) {
    const date = new Date(timestamp);
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.toISOString().slice(11, 19).replace(/:/g, '');
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `INC-${dateStr}-${timeStr}-${random}`;
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return this.isInitialized;
  }

  async getHealth() {
    return {
      status: this.isInitialized ? 'healthy' : 'unhealthy',
      details: {
        initialized: this.isInitialized,
        templatesLoaded: this.templates.size,
        defaultTemplate: this.defaultTemplate
      }
    };
  }
}

export default MaintenancePageService;