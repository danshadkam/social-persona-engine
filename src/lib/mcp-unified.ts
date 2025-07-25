/**
 * Unified MCP Client - Intelligently choose between different Bright Data access methods
 * 
 * This client provides a unified interface that can automatically fallback between:
 * 1. Official Bright Data MCP (preferred)
 * 2. Direct API calls (fallback)
 * 3. Web Unlocker (final fallback)
 */

import { officialBrightDataMCP, OfficialBrightDataMCPClient } from './mcp-brightdata-official';
import { brightDataMCP, BrightDataMCPClient } from './mcp-client';
import { createWebUnlocker, BrightDataWebUnlocker } from './mcp-config';

export interface UnifiedMCPResult {
  success: boolean;
  data?: any;
  error?: string;
  method?: 'official_mcp' | 'direct_api' | 'web_unlocker';
}

export interface UnifiedMCPConfig {
  preferredMethod?: 'official' | 'direct' | 'auto';
  enableFallback?: boolean;
  timeout?: number;
  retries?: number;
}

export class UnifiedBrightDataMCPClient {
  private config: UnifiedMCPConfig;
  private officialClient: OfficialBrightDataMCPClient | null = null;
  private directClient: BrightDataMCPClient | null = null;
  private webUnlocker: BrightDataWebUnlocker | null = null;

  constructor(config: UnifiedMCPConfig = {}) {
    this.config = {
      preferredMethod: config.preferredMethod || 'auto',
      enableFallback: config.enableFallback !== false, // Default to true
      timeout: config.timeout || 30000,
      retries: config.retries || 2
    };
  }

  async initialize(): Promise<void> {
    console.log('🔧 Initializing Unified MCP Client...', {
      preferredMethod: this.config.preferredMethod,
      enableFallback: this.config.enableFallback
    });

    // Initialize clients based on configuration and availability
    try {
      // Try to initialize official MCP first
      if (this.shouldUseMethod('official')) {
        try {
          this.officialClient = officialBrightDataMCP;
          await this.officialClient.initialize();
          console.log('✅ Official MCP client initialized');
        } catch (error) {
          console.warn('⚠️ Official MCP initialization failed:', error);
          this.officialClient = null;
        }
      }

      // Initialize direct API client
      if (this.shouldUseMethod('direct')) {
        try {
          this.directClient = brightDataMCP;
          await this.directClient.initialize();
          console.log('✅ Direct API client initialized');
        } catch (error) {
          console.warn('⚠️ Direct API initialization failed:', error);
          this.directClient = null;
        }
      }

      // Initialize Web Unlocker
      try {
        this.webUnlocker = createWebUnlocker();
        console.log('✅ Web Unlocker client initialized');
      } catch (error) {
        console.warn('⚠️ Web Unlocker initialization failed:', error);
        this.webUnlocker = null;
      }

    } catch (error) {
      console.error('❌ Unified MCP client initialization failed:', error);
      throw error;
    }
  }

  private shouldUseMethod(method: string): boolean {
    if (this.config.preferredMethod === 'auto') {
      return true; // Auto mode tries all methods
    }
    return this.config.preferredMethod === method;
  }

  private async executeWithFallback<T>(
    operation: string,
    implementations: Array<() => Promise<T>>
  ): Promise<UnifiedMCPResult> {
    const methods = ['official_mcp', 'direct_api', 'web_unlocker'];
    
    for (let i = 0; i < implementations.length; i++) {
      const implementation = implementations[i];
      const method = methods[i] as any;
      
      if (!implementation) continue;

      try {
        console.log(`🔄 Trying ${operation} via ${method}...`);
        const result = await implementation();
        console.log(`✅ ${operation} succeeded via ${method}`);
        
        return {
          success: true,
          data: result,
          method
        };
      } catch (error) {
        console.warn(`⚠️ ${operation} failed via ${method}:`, error);
        
        if (!this.config.enableFallback || i === implementations.length - 1) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            method
          };
        }
      }
    }

    return {
      success: false,
      error: 'All methods failed',
      method: undefined
    };
  }

  async listTools(): Promise<UnifiedMCPResult> {
    return this.executeWithFallback('listTools', [
      this.officialClient ? () => this.officialClient!.listTools() : null,
      null, // Direct API doesn't have listTools
      null  // Web Unlocker doesn't have listTools
    ].filter(Boolean) as Array<() => Promise<any>>);
  }

  async searchWeb(query: string): Promise<UnifiedMCPResult> {
    return this.executeWithFallback('searchWeb', [
      this.officialClient ? () => this.officialClient!.searchWeb(query) : null,
      this.directClient ? () => this.directClient!.scrapeWithSERP(query) : null,
      null
    ].filter(Boolean) as Array<() => Promise<any>>);
  }

  async unlockWebPage(url: string): Promise<UnifiedMCPResult> {
    return this.executeWithFallback('unlockWebPage', [
      this.officialClient ? () => this.officialClient!.unlockWebPage(url) : null,
      this.directClient ? () => this.directClient!.scrapeWithWebUnlocker(url) : null,
      this.webUnlocker ? () => this.webUnlocker!.scrapeGenericUrl(url) : null
    ].filter(Boolean) as Array<() => Promise<any>>);
  }

  async scrapeInstagramProfile(username: string): Promise<UnifiedMCPResult> {
    return this.executeWithFallback('scrapeInstagramProfile', [
      this.officialClient ? () => this.officialClient!.scrapeInstagramProfile(username) : null,
      this.directClient ? () => this.directClient!.scrapeInstagramProfile(username) : null,
      this.webUnlocker ? () => this.webUnlocker!.scrapeInstagramProfile(username) : null
    ].filter(Boolean) as Array<() => Promise<any>>);
  }

  async getBrowserSession(): Promise<UnifiedMCPResult> {
    return this.executeWithFallback('getBrowserSession', [
      this.officialClient ? () => this.officialClient!.getBrowserSession() : null,
      null, // Direct API doesn't have browser sessions
      null
    ].filter(Boolean) as Array<() => Promise<any>>);
  }

  async isHealthy(): Promise<boolean> {
    // Return true if any client is healthy
    const healthChecks = await Promise.allSettled([
      this.officialClient?.isHealthy() || Promise.resolve(false),
      Promise.resolve(!!this.directClient), // Direct client is always "healthy" if initialized
      Promise.resolve(!!this.webUnlocker)   // Web unlocker is always "healthy" if initialized
    ]);

    return healthChecks.some(result => 
      result.status === 'fulfilled' && result.value === true
    );
  }

  async disconnect(): Promise<void> {
    console.log('🔌 Disconnecting Unified MCP Client...');
    
    await Promise.allSettled([
      this.officialClient?.disconnect(),
      this.directClient?.close()
      // Web unlocker doesn't need explicit disconnect
    ]);

    this.officialClient = null;
    this.directClient = null;
    this.webUnlocker = null;

    console.log('✅ Unified MCP Client disconnected');
  }

  // Get status of all clients
  getStatus() {
    return {
      official: {
        available: !!this.officialClient,
        connected: this.officialClient?.isClientConnected() || false
      },
      direct: {
        available: !!this.directClient
      },
      webUnlocker: {
        available: !!this.webUnlocker
      },
      config: this.config
    };
  }

  // Preferred method for different use cases
  static getRecommendedConfig(useCase: 'production' | 'development' | 'ai_agents' | 'research'): UnifiedMCPConfig {
    switch (useCase) {
      case 'production':
        return {
          preferredMethod: 'direct',
          enableFallback: true,
          timeout: 30000,
          retries: 3
        };
      case 'development':
        return {
          preferredMethod: 'auto',
          enableFallback: true,
          timeout: 60000,
          retries: 2
        };
      case 'ai_agents':
        return {
          preferredMethod: 'official',
          enableFallback: true,
          timeout: 45000,
          retries: 2
        };
      case 'research':
        return {
          preferredMethod: 'auto',
          enableFallback: true,
          timeout: 120000,
          retries: 1
        };
      default:
        return {
          preferredMethod: 'auto',
          enableFallback: true,
          timeout: 30000,
          retries: 2
        };
    }
  }
}

// Export singleton instances for different use cases
export const unifiedMCPProduction = new UnifiedBrightDataMCPClient(
  UnifiedBrightDataMCPClient.getRecommendedConfig('production')
);

export const unifiedMCPDevelopment = new UnifiedBrightDataMCPClient(
  UnifiedBrightDataMCPClient.getRecommendedConfig('development')
);

export const unifiedMCPAIAgents = new UnifiedBrightDataMCPClient(
  UnifiedBrightDataMCPClient.getRecommendedConfig('ai_agents')
);

// Default unified client (auto mode)
export const unifiedMCP = new UnifiedBrightDataMCPClient(); 