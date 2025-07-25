import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"

interface BrightDataMCPConfig {
  apiToken: string;
  rateLimit?: string; // Format: "limit/time+unit" e.g., "100/1h", "50/30m", "10/5s"
  webUnlockerZone?: string;
  browserZone?: string;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: any;
}

export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class OfficialBrightDataMCPClient {
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;
  private isConnected: boolean = false;
  private config: BrightDataMCPConfig;

  constructor(config?: Partial<BrightDataMCPConfig>) {
    this.config = {
      apiToken: config?.apiToken || process.env.BRIGHT_DATA_API_TOKEN || process.env.API_TOKEN || '',
      rateLimit: config?.rateLimit || process.env.RATE_LIMIT,
      webUnlockerZone: config?.webUnlockerZone || process.env.WEB_UNLOCKER_ZONE || 'mcp_unlocker',
      browserZone: config?.browserZone || process.env.BROWSER_ZONE || 'mcp_browser'
    };

    if (!this.config.apiToken) {
      console.warn('⚠️ API_TOKEN not found. Set BRIGHT_DATA_API_TOKEN or API_TOKEN environment variable');
    }
  }

  async initialize(): Promise<void> {
    try {
      if (!this.config.apiToken) {
        throw new Error('API_TOKEN is required. Set BRIGHT_DATA_API_TOKEN or API_TOKEN environment variable');
      }

      console.log('🔧 Initializing Official Bright Data MCP client...');
      
      // Use the official Bright Data MCP server endpoint
      const serverUrl = new URL('https://mcp.brightdata.com/mcp');
      serverUrl.searchParams.set('token', this.config.apiToken);

      console.log('🌐 Connecting to Official Bright Data MCP server...', {
        endpoint: 'mcp.brightdata.com',
        webUnlockerZone: this.config.webUnlockerZone,
        browserZone: this.config.browserZone,
        rateLimit: this.config.rateLimit || 'not set'
      });

      // Create the streamable HTTP transport
      this.transport = new StreamableHTTPClientTransport(serverUrl);

      // Create MCP client
      this.client = new Client({
        name: "Social Persona Engine",
        version: "1.0.0"
      });

      // Connect to the server
      await this.client.connect(this.transport);
      this.isConnected = true;

      console.log('✅ Official Bright Data MCP client initialized and connected successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Official Bright Data MCP client:', error);
      throw new Error(`Official MCP initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listTools(): Promise<MCPTool[]> {
    try {
      if (!this.client || !this.isConnected) {
        await this.initialize();
      }

      if (!this.client) {
        throw new Error('MCP client not initialized');
      }

      console.log('📋 Listing available Official MCP tools...');
      const tools = await this.client.listTools();
      
      console.log(`✅ Found ${tools.tools.length} available tools:`, 
        tools.tools.map(t => t.name).join(", ")
      );

      return tools.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }));
    } catch (error) {
      console.error('❌ Failed to list tools:', error);
      throw error;
    }
  }

  async callTool(toolName: string, arguments_: any = {}): Promise<MCPToolResult> {
    try {
      if (!this.client || !this.isConnected) {
        await this.initialize();
      }

      if (!this.client) {
        throw new Error('MCP client not initialized');
      }

      console.log(`🔧 Calling Official MCP tool: ${toolName}`, arguments_);

      const result = await this.client.callTool({
        name: toolName,
        arguments: arguments_
      });

      console.log(`✅ Tool ${toolName} executed successfully`);

      return {
        success: true,
        data: result.content
      };
    } catch (error) {
      console.error(`❌ Tool ${toolName} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown tool error'
      };
    }
  }

  // High-level methods using the official tools
  async searchWeb(query: string): Promise<MCPToolResult> {
    console.log(`🔍 Web search: ${query} via Official MCP`);
    return this.callTool('web_search', { query });
  }

  async unlockWebPage(url: string): Promise<MCPToolResult> {
    console.log(`🔓 Unlocking web page: ${url} via Official MCP`);
    return this.callTool('web_unlocker', { url });
  }

  async getBrowserSession(): Promise<MCPToolResult> {
    console.log('🌐 Getting browser session via Official MCP');
    return this.callTool('browser_session', {});
  }

  async navigateBrowser(url: string, sessionId?: string): Promise<MCPToolResult> {
    console.log(`🧭 Navigating browser to: ${url} via Official MCP`);
    return this.callTool('browser_navigate', { 
      url,
      ...(sessionId && { session_id: sessionId })
    });
  }

  async clickElement(selector: string, sessionId?: string): Promise<MCPToolResult> {
    console.log(`👆 Clicking element: ${selector} via Official MCP`);
    return this.callTool('browser_click', { 
      selector,
      ...(sessionId && { session_id: sessionId })
    });
  }

  async getPageContent(sessionId?: string): Promise<MCPToolResult> {
    console.log('📄 Getting page content via Official MCP');
    return this.callTool('browser_get_content', {
      ...(sessionId && { session_id: sessionId })
    });
  }

  async takeScreenshot(sessionId?: string): Promise<MCPToolResult> {
    console.log('📸 Taking screenshot via Official MCP');
    return this.callTool('browser_screenshot', {
      ...(sessionId && { session_id: sessionId })
    });
  }

  async scrapeInstagramProfile(username: string): Promise<MCPToolResult> {
    const cleanUsername = username.replace('@', '');
    console.log(`📸 Scraping Instagram profile: @${cleanUsername} via Official MCP`);
    
    // Try different approaches based on available tools
    const tools = await this.listTools();
    const toolNames = tools.map(t => t.name);
    
    // Use the specific Instagram profiles tool
    if (toolNames.includes('web_data_instagram_profiles')) {
      console.log('✅ Using web_data_instagram_profiles tool');
      return this.callTool('web_data_instagram_profiles', {
        url: `https://www.instagram.com/${cleanUsername}/`
      });
    } else if (toolNames.includes('web_data')) {
      console.log('⚠️ Falling back to generic web_data tool');
      return this.callTool('web_data', {
        url: `https://www.instagram.com/${cleanUsername}/`,
        data_format: 'json'
      });
    } else if (toolNames.includes('web_unlocker')) {
      console.log('⚠️ Falling back to web_unlocker tool');
      return this.unlockWebPage(`https://www.instagram.com/${cleanUsername}/`);
    } else {
      // Fallback to browser automation
      console.log('⚠️ Falling back to browser automation');
      const sessionResult = await this.getBrowserSession();
      if (sessionResult.success && sessionResult.data?.session_id) {
        const sessionId = sessionResult.data.session_id;
        await this.navigateBrowser(`https://www.instagram.com/${cleanUsername}/`, sessionId);
        return this.getPageContent(sessionId);
      }
      throw new Error('No suitable tools available for Instagram scraping');
    }
  }

  async getToolInfo(toolName: string): Promise<MCPTool | null> {
    try {
      const tools = await this.listTools();
      return tools.find(tool => tool.name === toolName) || null;
    } catch (error) {
      console.error(`❌ Failed to get tool info for ${toolName}:`, error);
      return null;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }

      // Try to list tools as a health check
      await this.listTools();
      return true;
    } catch (error) {
      console.warn('⚠️ Official MCP client health check failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        console.log('🔌 Disconnecting Official MCP client...');
        // The SDK client doesn't have an explicit disconnect method
        // The connection will be cleaned up when the client is garbage collected
        this.isConnected = false;
        this.client = null;
        this.transport = null;
        console.log('✅ Official MCP client disconnected');
      }
    } catch (error) {
      console.error('❌ Error during Official MCP client disconnect:', error);
    }
  }

  // Getters for configuration
  getConfig(): BrightDataMCPConfig {
    return { ...this.config };
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }

  // Static method to check if official MCP is properly configured
  static isConfigured(): boolean {
    return !!(process.env.BRIGHT_DATA_API_TOKEN || process.env.API_TOKEN);
  }
}

// Export singleton instance
export const officialBrightDataMCP = new OfficialBrightDataMCPClient();

// Export factory function for custom configurations
export function createOfficialMCPClient(config?: Partial<BrightDataMCPConfig>): OfficialBrightDataMCPClient {
  return new OfficialBrightDataMCPClient(config);
} 