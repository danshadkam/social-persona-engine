import type { NextApiRequest, NextApiResponse } from 'next';
import { officialBrightDataMCP, createOfficialMCPClient, OfficialBrightDataMCPClient } from '@/lib/mcp-brightdata-official';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  const { action, username, url, query, selector, sessionId, config } = req.body;

  try {
    // Determine which client to use
    let client = officialBrightDataMCP;
    
    // If custom config is provided, create a new client instance
    if (config) {
      client = createOfficialMCPClient({
        apiToken: config.apiToken,
        rateLimit: config.rateLimit,
        webUnlockerZone: config.webUnlockerZone,
        browserZone: config.browserZone
      });
    }

    // Initialize the client if not already connected
    if (!client.isClientConnected()) {
      await client.initialize();
    }

    let result;

    switch (action) {
      case 'list_tools':
        console.log('📋 API: Listing Official MCP tools...');
        const tools = await client.listTools();
        result = {
          success: true,
          data: tools,
          message: `Found ${tools.length} available tools`
        };
        break;

      case 'search_web':
        if (!query) {
          return res.status(400).json({
            success: false,
            error: 'Query is required for web search'
          });
        }
        console.log(`🔍 API: Searching for "${query}" via Official MCP...`);
        result = await client.searchWeb(query);
        break;

      case 'unlock_webpage':
        if (!url) {
          return res.status(400).json({
            success: false,
            error: 'URL is required for web page unlocking'
          });
        }
        console.log(`🔓 API: Unlocking webpage ${url} via Official MCP...`);
        result = await client.unlockWebPage(url);
        break;

      case 'scrape_instagram':
        if (!username) {
          return res.status(400).json({
            success: false,
            error: 'Username is required for Instagram scraping'
          });
        }
        console.log(`📸 API: Scraping Instagram profile @${username} via Official MCP...`);
        result = await client.scrapeInstagramProfile(username);
        break;

      case 'browser_session':
        console.log('🌐 API: Getting browser session via Official MCP...');
        result = await client.getBrowserSession();
        break;

      case 'browser_navigate':
        if (!url) {
          return res.status(400).json({
            success: false,
            error: 'URL is required for browser navigation'
          });
        }
        console.log(`🧭 API: Navigating browser to ${url} via Official MCP...`);
        result = await client.navigateBrowser(url, sessionId);
        break;

      case 'browser_click':
        if (!selector) {
          return res.status(400).json({
            success: false,
            error: 'Selector is required for browser click'
          });
        }
        console.log(`👆 API: Clicking element ${selector} via Official MCP...`);
        result = await client.clickElement(selector, sessionId);
        break;

      case 'browser_content':
        console.log('📄 API: Getting page content via Official MCP...');
        result = await client.getPageContent(sessionId);
        break;

      case 'browser_screenshot':
        console.log('📸 API: Taking screenshot via Official MCP...');
        result = await client.takeScreenshot(sessionId);
        break;

      case 'health_check':
        console.log('❤️ API: Performing health check on Official MCP...');
        const isHealthy = await client.isHealthy();
        result = {
          success: isHealthy,
          data: { healthy: isHealthy },
          message: isHealthy ? 'Official MCP client is healthy' : 'Official MCP client is not healthy'
        };
        break;

      case 'get_config':
        console.log('⚙️ API: Getting Official MCP client configuration...');
        result = {
          success: true,
          data: {
            config: client.getConfig(),
            connected: client.isClientConnected(),
            hasApiToken: !!(process.env.BRIGHT_DATA_API_TOKEN || process.env.API_TOKEN)
          },
          message: 'Official MCP configuration retrieved successfully'
        };
        break;

      case 'call_tool':
        const { toolName, arguments: toolArgs } = req.body;
        if (!toolName) {
          return res.status(400).json({
            success: false,
            error: 'Tool name is required for call_tool action'
          });
        }
        console.log(`🔧 API: Calling tool "${toolName}" via Official MCP...`);
        result = await client.callTool(toolName, toolArgs || {});
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}. Available actions: list_tools, search_web, unlock_webpage, scrape_instagram, browser_session, browser_navigate, browser_click, browser_content, browser_screenshot, health_check, get_config, call_tool`
        });
    }

    console.log(`✅ API: Official MCP action "${action}" completed successfully`);
    return res.status(200).json(result);

  } catch (error) {
    console.error(`❌ API: Official MCP action "${action}" failed:`, error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown server error'
    });
  }
}

/**
 * Example API usage:
 * 
 * // List available tools
 * POST /api/mcp-official-test
 * {
 *   "action": "list_tools"
 * }
 * 
 * // Web search
 * POST /api/mcp-official-test
 * {
 *   "action": "search_web",
 *   "query": "Tesla stock price today"
 * }
 * 
 * // Unlock a webpage
 * POST /api/mcp-official-test
 * {
 *   "action": "unlock_webpage",
 *   "url": "https://example.com"
 * }
 * 
 * // Scrape Instagram profile
 * POST /api/mcp-official-test
 * {
 *   "action": "scrape_instagram",
 *   "username": "natgeo"
 * }
 * 
 * // Browser automation workflow
 * POST /api/mcp-official-test
 * {
 *   "action": "browser_session"
 * }
 * 
 * // Navigate browser (use sessionId from previous call)
 * POST /api/mcp-official-test
 * {
 *   "action": "browser_navigate",
 *   "url": "https://instagram.com/natgeo",
 *   "sessionId": "session-id-from-previous-call"
 * }
 * 
 * // Take screenshot
 * POST /api/mcp-official-test
 * {
 *   "action": "browser_screenshot",
 *   "sessionId": "session-id-from-previous-call"
 * }
 * 
 * // Custom configuration
 * POST /api/mcp-official-test
 * {
 *   "action": "search_web",
 *   "query": "AI trends 2024",
 *   "config": {
 *     "apiToken": "your-api-token",
 *     "rateLimit": "100/1h",
 *     "webUnlockerZone": "custom_unlocker",
 *     "browserZone": "custom_browser"
 *   }
 * }
 */ 