/**
 * Bright Data MCP Configuration and Connection Manager
 * Provides a robust interface for connecting to and using Bright Data MCP services
 * 
 * Usage Examples:
 * 
 * // Basic Instagram scraping
 * import { MCPTools } from '@/lib/mcp-config';
 * const result = await MCPTools.scrapeInstagram('natgeo');
 * 
 * // Web content unlocking
 * const webpage = await MCPTools.unlockUrl('https://example.com');
 * 
 * // Search engine results
 * const searchResults = await MCPTools.search('AI technology trends');
 * 
 * // Health check
 * const isHealthy = await MCPTools.isHealthy();
 * 
 * // Custom configuration
 * import { mcpConfig } from '@/lib/mcp-config';
 * mcpConfig.updateConfig({ timeout: 60000, retryAttempts: 5 });
 */

import { ProfileData } from './scraper';

interface BrightDataConfig {
  apiToken: string;
  zone: string;
  timeout?: number;
}

interface WebUnlockerRequest {
  zone: string;
  url: string;
  format: string;
  method: string;
  country?: string;
  render?: boolean;
  screenshot?: boolean;
  screenshot_options?: {
    full_page?: boolean;
    format?: 'png' | 'jpeg';
    quality?: number;
  };
  headers?: Record<string, string>;
  wait_for?: string;
  timeout?: number;
}

interface WebUnlockerResponse {
  url: string;
  status_code: number;
  headers: Record<string, string>;
  body: string;
  screenshot?: string; // Base64 encoded screenshot
  timestamp: string;
  ip?: string;
  country?: string;
}

export class BrightDataWebUnlocker {
  private config: BrightDataConfig;
  private readonly API_ENDPOINT = 'https://api.brightdata.com/request';

  constructor(config: BrightDataConfig) {
    this.config = config;
  }

  async scrapeInstagramProfile(username: string): Promise<WebUnlockerResponse> {
    const cleanUsername = username.replace('@', '');
    const targetUrl = `https://www.instagram.com/${cleanUsername}/`;
    
    console.log(`🌐 [Web Unlocker] Scraping: ${targetUrl}`);
    
    const requestBody: WebUnlockerRequest = {
      zone: this.config.zone,
      url: targetUrl,
      format: 'json',
      method: 'GET',
      country: 'us',
      render: true, // Enable JavaScript rendering for dynamic content
      screenshot: true, // Capture screenshot for visual analysis
      screenshot_options: {
        full_page: true,
        format: 'png',
        quality: 80
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      wait_for: 'networkidle2', // Wait for network to be idle
      timeout: this.config.timeout || 30000
    };

    try {
      console.log(`📡 [Web Unlocker] Making API request...`, {
        zone: this.config.zone,
        url: targetUrl,
        render: requestBody.render,
        screenshot: requestBody.screenshot
      });

      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [Web Unlocker] API error (${response.status}):`, errorText);
        throw new Error(`Web Unlocker API error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as WebUnlockerResponse;
      
      console.log(`✅ [Web Unlocker] Success!`, {
        statusCode: data.status_code,
        hasScreenshot: !!data.screenshot,
        bodyLength: data.body?.length || 0,
        country: data.country || 'unknown'
      });

      return data;
    } catch (error) {
      console.error(`❌ [Web Unlocker] Request failed:`, error);
      throw error;
    }
  }

  async scrapeGenericUrl(targetUrl: string): Promise<WebUnlockerResponse> {
    console.log(`🌐 [Web Unlocker] Scraping generic URL: ${targetUrl}`);
    
    const requestBody: WebUnlockerRequest = {
      zone: this.config.zone,
      url: targetUrl,
      format: 'json',
      method: 'GET',
      country: 'us',
      render: true,
      timeout: this.config.timeout || 30000
    };

    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json() as WebUnlockerResponse;
    } catch (error) {
      console.error(`❌ [Web Unlocker] Generic scrape failed:`, error);
      throw error;
    }
  }
}

// Factory function to create Web Unlocker client
export function createWebUnlocker(): BrightDataWebUnlocker {
  const config: BrightDataConfig = {
    apiToken: process.env.BRIGHT_DATA_API_KEY || '',
    zone: process.env.BRIGHT_DATA_WEB_UNLOCKER_ZONE || 'web_unlocker1',
    timeout: 30000,
  };

  if (!config.apiToken) {
    console.warn('⚠️ BRIGHT_DATA_API_KEY not found - Web Unlocker will not work');
    throw new Error('BRIGHT_DATA_API_KEY environment variable is required');
  }

  console.log(`🔧 [Web Unlocker] Initialized with zone: ${config.zone}`);
  return new BrightDataWebUnlocker(config);
}

// Legacy export for compatibility
export function createMCPClient() {
  try {
    return createWebUnlocker();
  } catch (error) {
    console.warn('⚠️ Web Unlocker initialization failed, using fallback');
    return null;
  }
} 