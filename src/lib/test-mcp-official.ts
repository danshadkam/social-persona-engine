/**
 * Test file demonstrating the Official Bright Data MCP integration
 * This shows how to use the official MCP server hosted by Bright Data
 */

import { officialBrightDataMCP, createOfficialMCPClient, OfficialBrightDataMCPClient } from './mcp-brightdata-official';

// Example 1: Using the singleton instance
export async function testOfficialSingletonClient() {
  console.log('\n🧪 Testing Official MCP Singleton Client...');
  
  try {
    // Initialize the client
    await officialBrightDataMCP.initialize();
    
    // List available tools
    const tools = await officialBrightDataMCP.listTools();
    console.log(`Available tools: ${tools.map(t => t.name).join(", ")}`);
    
    // Test web search
    const searchResult = await officialBrightDataMCP.searchWeb('Tesla stock price today');
    console.log('Web search result:', searchResult.success ? '✅ Success' : '❌ Failed');
    
    // Test web unlocking
    const webResult = await officialBrightDataMCP.unlockWebPage('https://example.com');
    console.log('Web unlocking result:', webResult.success ? '✅ Success' : '❌ Failed');
    
    // Test Instagram scraping
    const instagramResult = await officialBrightDataMCP.scrapeInstagramProfile('natgeo');
    console.log('Instagram scraping result:', instagramResult.success ? '✅ Success' : '❌ Failed');
    
    // Health check
    const isHealthy = await officialBrightDataMCP.isHealthy();
    console.log('Client health status:', isHealthy ? '✅ Healthy' : '❌ Unhealthy');
    
    // Disconnect
    await officialBrightDataMCP.disconnect();
    
  } catch (error) {
    console.error('❌ Official singleton test failed:', error);
  }
}

// Example 2: Using a custom configured client
export async function testOfficialCustomClient() {
  console.log('\n🧪 Testing Official MCP Custom Client...');
  
  try {
    // Create a custom client with specific configuration
    const customClient = createOfficialMCPClient({
      apiToken: process.env.BRIGHT_DATA_API_TOKEN || process.env.API_TOKEN || '',
      rateLimit: '100/1h',
      webUnlockerZone: 'custom_unlocker',
      browserZone: 'custom_browser'
    });
    
    // Initialize and test
    await customClient.initialize();
    console.log('Custom client config:', customClient.getConfig());
    
    // Test a specific tool
    const tools = await customClient.listTools();
    if (tools.length > 0) {
      const toolInfo = await customClient.getToolInfo(tools[0].name);
      console.log('First tool info:', toolInfo);
    }
    
    // Disconnect
    await customClient.disconnect();
    
  } catch (error) {
    console.error('❌ Official custom client test failed:', error);
  }
}

// Example 3: Browser automation workflow
export async function testOfficialBrowserAutomation() {
  console.log('\n🧪 Testing Official MCP Browser Automation...');
  
  const client = new OfficialBrightDataMCPClient();
  
  try {
    // Initialize client
    await client.initialize();
    
    // Start browser session
    console.log('🌐 Starting browser session...');
    const sessionResult = await client.getBrowserSession();
    
    if (sessionResult.success && sessionResult.data?.session_id) {
      const sessionId = sessionResult.data.session_id;
      console.log(`✅ Browser session created: ${sessionId}`);
      
      // Navigate to a website
      console.log('🧭 Navigating to Instagram...');
      await client.navigateBrowser('https://www.instagram.com', sessionId);
      
      // Take screenshot
      console.log('📸 Taking screenshot...');
      const screenshotResult = await client.takeScreenshot(sessionId);
      console.log('Screenshot result:', screenshotResult.success ? '✅ Success' : '❌ Failed');
      
      // Get page content
      console.log('📄 Getting page content...');
      const contentResult = await client.getPageContent(sessionId);
      console.log('Content result:', contentResult.success ? '✅ Success' : '❌ Failed');
      
    } else {
      console.log('❌ Failed to create browser session');
    }
    
  } catch (error) {
    console.error('❌ Browser automation test failed:', error);
  } finally {
    // Always disconnect
    await client.disconnect();
  }
}

// Example 4: Advanced usage with retry logic and multiple operations
export async function testOfficialAdvancedUsage() {
  console.log('\n🧪 Testing Official MCP Advanced Usage...');
  
  const client = new OfficialBrightDataMCPClient({
    rateLimit: '50/30m' // Custom rate limiting
  });
  
  try {
    // Initialize with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await client.initialize();
        console.log('✅ Client initialized successfully');
        break;
      } catch (error) {
        retries--;
        console.warn(`⚠️ Initialization failed, ${retries} retries left:`, error);
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }
    
    // Test multiple operations concurrently
    const operations = [
      () => client.searchWeb('AI technology trends 2024'),
      () => client.unlockWebPage('https://www.wikipedia.org'),
      () => client.searchWeb('crypto market today')
    ];
    
    console.log('🔄 Running multiple operations concurrently...');
    const results = await Promise.allSettled(operations.map(op => op()));
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ Operation ${index + 1} succeeded`);
      } else {
        console.error(`❌ Operation ${index + 1} failed:`, result.reason);
      }
    });
    
  } catch (error) {
    console.error('❌ Advanced usage test failed:', error);
  } finally {
    // Always disconnect
    await client.disconnect();
  }
}

// Example 5: Tool discovery and dynamic usage
export async function testOfficialToolDiscovery() {
  console.log('\n🧪 Testing Official MCP Tool Discovery...');
  
  try {
    await officialBrightDataMCP.initialize();
    
    // Discover all available tools
    const tools = await officialBrightDataMCP.listTools();
    console.log('\n📋 Available tools:');
    
    for (const tool of tools) {
      console.log(`\n🔧 Tool: ${tool.name}`);
      console.log(`   Description: ${tool.description || 'No description'}`);
      
      if (tool.inputSchema) {
        console.log(`   Input Schema: ${JSON.stringify(tool.inputSchema, null, 2)}`);
      }
    }
    
    // Test calling tools dynamically
    if (tools.some(t => t.name === 'web_search')) {
      console.log('\n🔍 Testing web_search tool...');
      const result = await officialBrightDataMCP.callTool('web_search', {
        query: 'Model Context Protocol documentation'
      });
      console.log('Web search result:', result.success ? '✅ Success' : '❌ Failed');
    }
    
    await officialBrightDataMCP.disconnect();
    
  } catch (error) {
    console.error('❌ Tool discovery test failed:', error);
  }
}

// Main test runner
export async function runAllOfficialMCPTests() {
  console.log('🚀 Starting Official Bright Data MCP Tests...');
  
  // Check if API token is configured
  const hasApiToken = !!(process.env.BRIGHT_DATA_API_TOKEN || process.env.API_TOKEN);
  
  if (!hasApiToken) {
    console.warn('⚠️ No API token found. Set BRIGHT_DATA_API_TOKEN or API_TOKEN environment variable');
    console.log('📝 Some tests may fail without proper authentication');
  }
  
  await testOfficialSingletonClient();
  await testOfficialCustomClient();
  await testOfficialBrowserAutomation();
  await testOfficialAdvancedUsage();
  await testOfficialToolDiscovery();
  
  console.log('\n✅ All Official MCP tests completed!');
}

// All functions are already exported individually above 