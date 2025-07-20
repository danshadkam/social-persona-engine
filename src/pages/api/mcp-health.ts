import { NextApiRequest, NextApiResponse } from 'next';
import { mcpConfig, MCPTools } from '@/lib/mcp-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const startTime = Date.now();

    // Perform health checks with graceful error handling
    let healthResult: any = { success: false, message: 'Not tested' };
    let isHealthy = false;
    let accountResult: any = null;

    try {
      healthResult = await mcpConfig.healthCheck();
      isHealthy = await MCPTools.isHealthy();
    } catch (healthError) {
      console.warn('⚠️ Health check failed:', healthError instanceof Error ? healthError.message : 'Unknown error');
      healthResult = { 
        success: false, 
        message: healthError instanceof Error ? healthError.message : 'Health check failed' 
      };
    }
    
    // Try to get account information, but don't fail if it doesn't work
    try {
      accountResult = await mcpConfig.getAccountInfo();
    } catch (accountError) {
      console.warn('⚠️ Account info check failed:', accountError instanceof Error ? accountError.message : 'Unknown error');
      accountResult = { 
        success: false, 
        message: accountError instanceof Error ? accountError.message : 'Account check failed' 
      };
    }
    
    // Get current configuration (without sensitive data)
    const config = mcpConfig.getConfig();
    
    const totalTime = Date.now() - startTime;

    const healthStatus = {
      status: healthResult.success && isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      response_time_ms: totalTime,
      checks: {
        connection: {
          status: healthResult.success ? 'pass' : 'fail',
          error: (!healthResult.success && healthResult.message) ? healthResult.message : null,
        },
        api_access: {
          status: accountResult?.success ? 'pass' : 'fail',
          error: (accountResult && !accountResult.success && accountResult.message) ? accountResult.message : null,
        },
        configuration: {
          status: 'pass',
          zones: {
            web_unlocker: config.webUnlockerZone,
            browser: config.browserZone,
          },
          rate_limit: config.rateLimit,
          timeout_ms: config.timeout,
          retry_attempts: config.retryAttempts,
        },
      },
      metadata: {
        sdk_version: '2.4.1',
        environment: process.env.NODE_ENV || 'development',
        has_api_token: !!process.env.BRIGHT_DATA_API_TOKEN,
      },
    };

    // Return appropriate status code
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Health check failed:', errorMessage);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: errorMessage,
      checks: {
        connection: { status: 'fail', error: errorMessage },
        api_access: { status: 'fail', error: 'Could not test API access' },
        configuration: { status: 'unknown', error: 'Could not load configuration' },
      },
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        has_api_token: !!process.env.BRIGHT_DATA_API_TOKEN,
      },
    });
  }
} 