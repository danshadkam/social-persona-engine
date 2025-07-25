# Official Bright Data MCP Implementation

This document explains how to use the **Official Bright Data MCP Server** as referenced in the [official documentation](https://docs.brightdata.com/api-reference/MCP-Server) and [GitHub repository](https://github.com/brightdata/brightdata-mcp).

## Overview

The official implementation connects directly to **Bright Data's hosted MCP server** at `https://mcp.brightdata.com/mcp`.

## Architecture Comparison

### What You Now Have:

| **Implementation** | **Server URL** | **Authentication** | **Features** |
|-------------------|----------------|-------------------|--------------|
| **Official MCP** | `mcp.brightdata.com/mcp?token=TOKEN` | API Token only | ✅ All official tools + browser automation |
| **Direct API** | `api.brightdata.com/*` | Bearer token | ✅ Raw API access |
| **Web Unlocker** | `api.brightdata.com/request` | Bearer token | ✅ Web unlocking + screenshots |
| **Unified Client** | Auto-fallback | Any available | ✅ Intelligent method selection |

## Installation & Setup

### 1. Dependencies (Already Installed)
```bash
npm install @brightdata/mcp @modelcontextprotocol/sdk
```

### 2. Environment Variables
```bash
# Primary (required)
BRIGHT_DATA_API_TOKEN=your-api-token-here
# or
API_TOKEN=your-api-token-here

# Optional configuration
RATE_LIMIT=100/1h                    # Format: limit/time+unit
WEB_UNLOCKER_ZONE=mcp_unlocker       # Default zone name
BROWSER_ZONE=mcp_browser             # Default zone name
```

### 3. Get Your API Token
1. Go to [Bright Data user settings](https://brightdata.com/user)
2. Copy your API token (format: `2dceb1aa0***************************`)

## Usage Examples

### Basic Usage

```typescript
import { officialBrightDataMCP } from '@/lib/mcp-brightdata-official';

async function basicExample() {
  // Initialize connection
  await officialBrightDataMCP.initialize();
  
  // List all available tools
  const tools = await officialBrightDataMCP.listTools();
  console.log('Available tools:', tools.map(t => t.name));
  
  // Search the web
  const searchResult = await officialBrightDataMCP.searchWeb('Tesla stock price');
  
  // Unlock a webpage
  const webResult = await officialBrightDataMCP.unlockWebPage('https://example.com');
  
  // Scrape Instagram
  const igResult = await officialBrightDataMCP.scrapeInstagramProfile('natgeo');
  
  // Clean up
  await officialBrightDataMCP.disconnect();
}
```

### Custom Configuration

```typescript
import { createOfficialMCPClient } from '@/lib/mcp-brightdata-official';

const client = createOfficialMCPClient({
  apiToken: 'your-token',
  rateLimit: '100/1h',               // 100 requests per hour
  webUnlockerZone: 'custom_unlocker',
  browserZone: 'custom_browser'
});

await client.initialize();
const result = await client.searchWeb('AI trends 2024');
```

### Browser Automation

```typescript
import { officialBrightDataMCP } from '@/lib/mcp-brightdata-official';

async function browserAutomation() {
  await officialBrightDataMCP.initialize();
  
  // Start browser session
  const session = await officialBrightDataMCP.getBrowserSession();
  const sessionId = session.data?.session_id;
  
  if (sessionId) {
    // Navigate to website
    await officialBrightDataMCP.navigateBrowser('https://instagram.com/natgeo', sessionId);
    
    // Take screenshot
    const screenshot = await officialBrightDataMCP.takeScreenshot(sessionId);
    
    // Get page content
    const content = await officialBrightDataMCP.getPageContent(sessionId);
    
    console.log('Screenshot:', screenshot.success);
    console.log('Content length:', content.data?.length);
  }
}
```

## API Endpoints

### Test Official MCP: `/api/mcp-official-test`

```bash
# List available tools
curl -X POST http://localhost:3000/api/mcp-official-test \
  -H "Content-Type: application/json" \
  -d '{"action": "list_tools"}'

# Web search
curl -X POST http://localhost:3000/api/mcp-official-test \
  -H "Content-Type: application/json" \
  -d '{"action": "search_web", "query": "Tesla stock price today"}'

# Scrape Instagram
curl -X POST http://localhost:3000/api/mcp-official-test \
  -H "Content-Type: application/json" \
  -d '{"action": "scrape_instagram", "username": "natgeo"}'

# Browser session
curl -X POST http://localhost:3000/api/mcp-official-test \
  -H "Content-Type: application/json" \
  -d '{"action": "browser_session"}'
```

## Available Tools (Official MCP)

Based on the [GitHub repository](https://github.com/brightdata/brightdata-mcp), the official server provides:

| **Tool Name** | **Description** | **Use Case** |
|---------------|-----------------|--------------|
| `web_search` | Search the web with Google/Bing | General web queries |
| `web_unlocker` | Unlock websites with anti-bot protection | Access protected content |
| `web_data` | Extract structured data from websites | Data scraping |
| `browser_session` | Start a remote browser session | Browser automation |
| `browser_navigate` | Navigate browser to URL | Page navigation |
| `browser_click` | Click elements on page | User interactions |
| `browser_get_content` | Get current page content | Content extraction |
| `browser_screenshot` | Take page screenshots | Visual verification |

## Unified Client (Recommended)

For production use, the **Unified Client** provides intelligent fallback:

```typescript
import { unifiedMCP, unifiedMCPProduction } from '@/lib/mcp-unified';

// Auto-mode (tries all methods)
await unifiedMCP.initialize();
const result = await unifiedMCP.scrapeInstagramProfile('natgeo');
console.log(`Success via: ${result.method}`); // official_mcp, direct_api, web_unlocker

// Production mode (prioritizes direct API for speed)
await unifiedMCPProduction.initialize();
const searchResult = await unifiedMCPProduction.searchWeb('AI trends');
```

### Unified Client Benefits:
- ✅ **Automatic Fallback**: If official MCP fails, tries direct API, then web unlocker
- ✅ **Method Reporting**: Know which method succeeded
- ✅ **Use-Case Optimization**: Different configs for production, development, AI agents
- ✅ **Health Monitoring**: Overall system health across all methods

## Configuration for Claude Desktop

### Option 1: Direct Configuration
```json
{
  "mcpServers": {
    "Bright Data Official": {
      "command": "npx",
      "args": ["@brightdata/mcp"],
      "env": {
        "API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

### Option 2: Advanced Configuration
```json
{
  "mcpServers": {
    "Bright Data Official": {
      "command": "npx", 
      "args": ["@brightdata/mcp"],
      "env": {
        "API_TOKEN": "your-api-token-here",
        "RATE_LIMIT": "100/1h",
        "WEB_UNLOCKER_ZONE": "my_unlocker",
        "BROWSER_ZONE": "my_browser"
      }
    }
  }
}
```

### Option 3: Multiple Methods
```json
{
  "mcpServers": {
    "Bright Data Official": {
      "command": "npx",
      "args": ["@brightdata/mcp"],
      "env": {
        "API_TOKEN": "your-api-token"
      }
    },
    "Bright Data Hosted": {
      "command": "npx",
      "args": [
        "mcp-remote", 
        "https://mcp.brightdata.com/mcp?token=your-api-token"
      ]
    }
  }
}
```

## Testing

### Run Official MCP Tests
```typescript
import { runAllOfficialMCPTests } from '@/lib/test-mcp-official';

// Run all tests
await runAllOfficialMCPTests();

// Or run individual tests
import { testOfficialBrowserAutomation } from '@/lib/test-mcp-official';
await testOfficialBrowserAutomation();
```

### Test with curl
```bash
# Health check
curl -X POST http://localhost:3000/api/mcp-official-test \
  -H "Content-Type: application/json" \
  -d '{"action": "health_check"}'

# Get configuration
curl -X POST http://localhost:3000/api/mcp-official-test \
  -H "Content-Type: application/json" \
  -d '{"action": "get_config"}'
```

## Key Benefits of Official Implementation

### ✅ **Advantages:**
1. **Official Support**: Directly supported by Bright Data
2. **Latest Features**: Always has newest tools and capabilities  
3. **Free Tier**: 5,000 requests per month at no cost
4. **Automatic Zones**: Creates zones automatically
5. **Browser Automation**: Full browser control capabilities
6. **Tool Discovery**: Dynamic tool listing and introspection

### ⚠️ **Considerations:**
1. **Rate Limits**: Built-in rate limiting (configurable)
2. **Network Dependency**: Requires connection to Bright Data servers
3. **Token Management**: Requires valid API token

## Simplified Architecture

The implementation now focuses on the most reliable and officially supported methods:

### Official MCP (Primary):
```typescript
import { officialBrightDataMCP } from '@/lib/mcp-brightdata-official';
// Just API token, automatic zone creation, full feature set
```

### Direct API (Performance):
```typescript
import { brightDataMCP } from '@/lib/mcp-client';
// Direct API access for maximum speed and control
```

### Unified Client (Recommended):
```typescript
import { unifiedMCP } from '@/lib/mcp-unified';
// Automatic fallback between official MCP, direct API, and web unlocker
```

## Troubleshooting

### Common Issues:

1. **Authentication Failed**
   ```bash
   # Check your token
   echo $API_TOKEN
   # or
   echo $BRIGHT_DATA_API_TOKEN
   ```

2. **Rate Limiting**
   ```bash
   # Set custom rate limit
   export RATE_LIMIT="50/30m"  # 50 requests per 30 minutes
   ```

3. **Connection Timeout**
   ```typescript
   // Use longer timeout
   const client = createOfficialMCPClient({
     apiToken: 'your-token'
   });
   ```

4. **No Available Tools**
   ```typescript
   // Check connection
   const isHealthy = await officialBrightDataMCP.isHealthy();
   console.log('Health:', isHealthy);
   ```

## Free Tier Information

From the [official documentation](https://docs.brightdata.com/api-reference/MCP-Server):

- ✅ **5,000 requests per month** completely free
- ✅ **No credit card required** to start
- ✅ **Pay-as-you-go** for additional usage
- ✅ **Monitor usage** in your Bright Data dashboard

## Summary

You now have **complete coverage** of Bright Data's offerings:

1. **Official MCP** (`mcp-brightdata-official.ts`) - Direct connection to Bright Data's hosted server
2. **Direct API** (`mcp-client.ts`) - Raw API access for maximum control
3. **Web Unlocker** (`mcp-config.ts`) - Specialized web unlocking with screenshots
4. **Unified Client** (`mcp-unified.ts`) - Intelligent fallback between all methods

This gives you maximum flexibility and reliability for any use case! 🚀 