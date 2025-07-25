import { officialBrightDataMCP } from './mcp-brightdata-official';

export interface ProfileData {
  username: string;
  platform: 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'unknown';
  bio: string;
  posts: PostData[];
  followers: number;
  following: number;
  profile_image_url?: string;
  is_verified?: boolean;
  real_data?: boolean;
  raw_data?: any;
}

export interface PostData {
  caption: string;
  likes: number;
  comments: CommentData[];
  timestamp: string;
}

export interface CommentData {
  text: string;
  author: string;
  timestamp: string;
}

export interface PlatformInfo {
  platform: string;
  username: string;
  url: string;
}

// Extract platform and username from various input formats
export function detectPlatform(input: string): PlatformInfo {
  // Clean up the input
  const cleanInput = input.trim();
  
  // Handle direct URLs
  if (cleanInput.startsWith('http')) {
    if (cleanInput.includes('instagram.com')) {
      const match = cleanInput.match(/instagram\.com\/([^/?]+)/);
      return {
        platform: 'instagram',
        username: match ? match[1] : cleanInput,
        url: cleanInput
      };
    }
    if (cleanInput.includes('linkedin.com/in/')) {
      const match = cleanInput.match(/linkedin\.com\/in\/([^/?]+)/);
      return {
        platform: 'linkedin',
        username: match ? match[1] : cleanInput,
        url: cleanInput
      };
    }
    if (cleanInput.includes('tiktok.com/@')) {
      const match = cleanInput.match(/tiktok\.com\/@([^/?]+)/);
      return {
        platform: 'tiktok',
        username: match ? match[1] : cleanInput,
        url: cleanInput
      };
    }
    if (cleanInput.includes('youtube.com/@')) {
      const match = cleanInput.match(/youtube\.com\/@([^/?]+)/);
      return {
        platform: 'youtube',
        username: match ? match[1] : cleanInput,
        url: cleanInput
      };
    }
    // Default to unknown platform but still try to extract username
    const parts = cleanInput.split('/');
    const username = parts[parts.length - 1] || cleanInput;
    return {
      platform: 'unknown',
      username: username,
      url: cleanInput
    };
  }
  
  // Handle @username format or plain username - default to Instagram
  const username = cleanInput.startsWith('@') ? cleanInput.slice(1) : cleanInput;
  return {
    platform: 'instagram',
    username: username,
    url: `https://www.instagram.com/${username}/`
  };
}

// Create a safe filename from username/URL
export function createSafeFilename(input: string): string {
  // If it's a URL, extract meaningful part
  if (input.startsWith('http')) {
    const platformInfo = detectPlatform(input);
    return platformInfo.username.replace(/[^a-zA-Z0-9_-]/g, '_');
  }
  
  // For usernames, just clean them
  return input.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^@/, '');
}

export async function scrapeProfile(input: string): Promise<ProfileData> {
  const platformInfo = detectPlatform(input);
  console.log(`🔍 Starting ${platformInfo.platform} profile scraping for: ${platformInfo.username}`);
  console.log(`🌐 Platform: ${platformInfo.platform}, URL: ${platformInfo.url}`);

  try {
    console.log(`🔧 [DEBUG] Starting MCP scraping for ${platformInfo.username}`);
    
    // Initialize the official MCP client
    if (!officialBrightDataMCP.isClientConnected()) {
      console.log('🔧 Initializing official Bright Data MCP...');
      await officialBrightDataMCP.initialize();
    }

    let mcpResult: any = null;

    // Use the appropriate MCP tool based on platform
    switch (platformInfo.platform) {
      case 'instagram':
        console.log('📱 Using Instagram MCP tool...');
        mcpResult = await officialBrightDataMCP.callTool('web_data_instagram_profiles', {
          url: platformInfo.url
        });
        break;
        
      case 'linkedin':
        console.log('💼 Using LinkedIn MCP tool...');
        mcpResult = await officialBrightDataMCP.callTool('web_data_linkedin_person_profile', {
          url: platformInfo.url
        });
        break;
        
      case 'tiktok':
        console.log('🎵 Using TikTok MCP tool...');
        mcpResult = await officialBrightDataMCP.callTool('web_data_tiktok_profiles', {
          url: platformInfo.url
        });
        break;
        
      case 'youtube':
        console.log('📺 Using YouTube MCP tool...');
        mcpResult = await officialBrightDataMCP.callTool('web_data_youtube_profiles', {
          url: platformInfo.url
        });
        break;
        
      default:
        throw new Error(`Unsupported platform: ${platformInfo.platform}`);
    }

    console.log(`🔍 [DEBUG] MCP result:`, {
      success: mcpResult.success,
      hasData: !!(mcpResult.data && mcpResult.data.length > 0),
      dataLength: mcpResult.data?.length || 0,
      error: mcpResult.error
    });

    if (mcpResult.success && mcpResult.data && mcpResult.data.length > 0) {
      console.log('✅ Successfully retrieved data via official MCP');
      return processMCPData(mcpResult.data[0], platformInfo);
    } else {
      throw new Error(`MCP returned no data: ${mcpResult.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.error(`❌ Official MCP failed for ${platformInfo.platform}:`, error);
    console.log('🔄 Falling back to enhanced mock data...');
    return createEnhancedMockData(platformInfo);
  }
}

function processMCPData(data: any, platformInfo: PlatformInfo): ProfileData {
  try {
    // Parse the text data (it comes as JSON string, often containing an array)
    let parsedData = typeof data.text === 'string' ? JSON.parse(data.text) : data;
    
    // Handle case where parsed data is an array (common with Instagram MCP)
    if (Array.isArray(parsedData) && parsedData.length > 0) {
      parsedData = parsedData[0];
    }
    
    console.log('📊 Processing MCP data for platform:', platformInfo.platform);
    console.log('🔍 Parsed data keys:', Object.keys(parsedData || {}));

    switch (platformInfo.platform) {
      case 'instagram':
        return processInstagramData(parsedData, platformInfo);
      case 'linkedin':
        return processLinkedInData(parsedData, platformInfo);
      case 'tiktok':
        return processTikTokData(parsedData, platformInfo);
      case 'youtube':
        return processYouTubeData(parsedData, platformInfo);
      default:
        throw new Error(`No processor for platform: ${platformInfo.platform}`);
    }
  } catch (error) {
    console.error('❌ Error processing MCP data:', error);
    throw error;
  }
}

function processInstagramData(data: any, platformInfo: PlatformInfo): ProfileData {
  return {
    username: data.account || platformInfo.username,
    platform: 'instagram',
    bio: data.biography || data.bio || '',
    followers: parseInt(data.followers) || 0,
    following: parseInt(data.following) || 0,
    profile_image_url: data.profile_image_link || data.profile_pic_url,
    is_verified: data.is_verified || false,
    posts: (data.posts || []).slice(0, 10).map((post: any) => ({
      caption: post.caption || '',
      likes: parseInt(post.likes) || 0,
      comments: [],
      timestamp: post.datetime || post.timestamp || new Date().toISOString()
    })),
    real_data: true,
    raw_data: data
  };
}

function processLinkedInData(data: any, platformInfo: PlatformInfo): ProfileData {
  return {
    username: platformInfo.username,
    platform: 'linkedin',
    bio: data.about || data.summary || '',
    followers: parseInt(data.followers) || 0,
    following: parseInt(data.connections) || 0,
    profile_image_url: data.avatar || data.profile_pic_url,
    is_verified: false, // LinkedIn doesn't have verification badges like social media
    posts: [], // LinkedIn posts would need separate API call
    real_data: true,
    raw_data: data
  };
}

function processTikTokData(data: any, platformInfo: PlatformInfo): ProfileData {
  return {
    username: platformInfo.username,
    platform: 'tiktok',
    bio: data.bio || data.description || '',
    followers: parseInt(data.followers) || 0,
    following: parseInt(data.following) || 0,
    profile_image_url: data.profile_pic_url || data.avatar,
    is_verified: data.is_verified || false,
    posts: [], // TikTok posts would need separate API call
    real_data: true,
    raw_data: data
  };
}

function processYouTubeData(data: any, platformInfo: PlatformInfo): ProfileData {
  return {
    username: platformInfo.username,
    platform: 'youtube',
    bio: data.Description || data.description || '',
    followers: parseInt(data.subscribers) || 0,
    following: 0, // YouTube doesn't show following count
    profile_image_url: data.profile_image,
    is_verified: false, // YouTube verification is different
    posts: (data.top_videos || []).slice(0, 10).map((video: any) => ({
      caption: video.title || '',
      likes: parseInt(video.views) || 0,
      comments: [],
      timestamp: video.posted_time || new Date().toISOString()
    })),
    real_data: true,
    raw_data: data
  };
}

function createEnhancedMockData(platformInfo: PlatformInfo): ProfileData {
  const mockData = {
    username: platformInfo.username,
    platform: platformInfo.platform as any,
    bio: `This is a mock profile for ${platformInfo.username} on ${platformInfo.platform}. Enhanced with realistic personality traits and interests for demonstration purposes.`,
    followers: Math.floor(Math.random() * 10000) + 1000,
    following: Math.floor(Math.random() * 1000) + 100,
    profile_image_url: `https://ui-avatars.com/api/?name=${platformInfo.username}&background=random`,
    is_verified: Math.random() > 0.7,
    posts: Array.from({ length: 5 }, (_, i) => ({
      caption: `Mock post ${i + 1} for ${platformInfo.username}. This is sample content for testing purposes.`,
      likes: Math.floor(Math.random() * 1000),
      comments: [],
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
    })),
    real_data: false,
    raw_data: null
  };

  console.log(`🔄 Created enhanced mock data for ${platformInfo.platform} profile: ${platformInfo.username}`);
  return mockData;
} 