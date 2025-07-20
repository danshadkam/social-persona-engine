import { MCPTools, MCPResponse, InstagramProfileData } from './mcp-config';

export interface ProfileData {
  username: string;
  bio: string;
  posts: PostData[];
  followers: number;
  following: number;
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

export async function scrapeProfile(username: string): Promise<ProfileData> {
  console.log(`🔍 Starting Instagram profile scraping for @${username}`);

  try {
    // Try the Instagram Datasets API first
    console.log('📊 Attempting Dataset API...');
    const mcpResult: MCPResponse<InstagramProfileData> = await MCPTools.scrapeInstagram(username);
    
    if (mcpResult.success && mcpResult.data) {
      console.log('✅ Successfully retrieved data via Bright Data Dataset API');
      console.log(`📊 MCP Metadata:`, mcpResult.metadata);
      
      const profileData = transformMCPResult(username, mcpResult.data);
      
      console.log('📈 Profile Data Summary:', {
        username: profileData.username,
        bioLength: profileData.bio.length,
        postsCount: profileData.posts.length,
        followers: profileData.followers,
        following: profileData.following,
        isRealData: !profileData.bio.includes('Mock'),
      });

      return profileData;
    } else {
      console.warn('⚠️ Dataset API failed, trying Web Unlocker fallback...');
      
      // Try Web Unlocker as fallback
      const { mcpConfig } = await import('./mcp-config');
      const unlockerResult = await mcpConfig.scrapeInstagramWithUnlocker(username);
      
      if (unlockerResult.success && unlockerResult.data) {
        console.log('✅ Successfully retrieved data via Web Unlocker');
        // Process the HTML response from Web Unlocker
        const processedData = processWebUnlockerData(username, unlockerResult.data);
        return processedData;
      } else {
        console.warn('⚠️ Both Dataset API and Web Unlocker failed, using fallback');
      }
    }
  } catch (error) {
    console.error('❌ MCP scraping error:', error);
  }

  // Final fallback to enhanced mock data
  console.log('🔄 Falling back to alternative methods...');
  
  return await fallbackScrapeProfile(username);
}

function processWebUnlockerData(username: string, htmlData: any): ProfileData {
  console.log('🔄 Processing Web Unlocker HTML data...');
  
  // For now, we'll use enhanced mock data since parsing Instagram HTML is complex
  // In a real implementation, you'd parse the HTML to extract profile data
  console.log('📝 Note: HTML parsing not implemented, using enhanced mock data');
  
  return createEnhancedMockData(username);
}

function transformMCPResult(username: string, mcpData: InstagramProfileData): ProfileData {
  // Transform MCP response to our ProfileData format
  const result = {
    username,
    bio: mcpData.bio || '',
    posts: transformMCPPosts(mcpData.posts || []),
    followers: mcpData.followers || 0,
    following: mcpData.following || 0,
  };
  
  // Check if we actually got meaningful data
  const hasData = result.bio.length > 0 || result.posts.length > 0 || result.followers > 0;
  
  if (!hasData) {
    console.warn(`⚠️ MCP returned empty data for @${username}, using fallback`);
    throw new Error('Empty data from MCP - fallback required');
  }
  
  return result;
}

function transformMCPPosts(posts: InstagramProfileData['posts']): PostData[] {
  if (!Array.isArray(posts)) return [];
  
  return posts.map(post => ({
    caption: post.caption || '',
    likes: post.likes || 0,
    comments: [], // MCP might not provide comments, we'll generate empty array
    timestamp: post.timestamp || new Date().toISOString(),
  }));
}

async function fallbackScrapeProfile(username: string): Promise<ProfileData> {
  console.log(`🔄 Using fallback scraping method for @${username}`);
  
  try {
    // Try Web Unlocker as secondary option
    const unlockResult = await MCPTools.unlockUrl(`https://www.instagram.com/${username}/`);

    if (unlockResult.success && unlockResult.data) {
      console.log('✅ Successfully retrieved data via Web Unlocker MCP');
      return parseHTMLProfile(username, unlockResult.data.html);
    }

    // Try direct API as third option
    const brightDataApiToken = process.env.BRIGHT_DATA_API_TOKEN;
    
    if (brightDataApiToken) {
      console.log('🔄 Trying direct Bright Data API...');
      
      const response = await fetch('https://api.brightdata.com/dca/trigger_immediate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${brightDataApiToken}`,
        },
        body: JSON.stringify({
          collector_type: 'web_data_instagram_profile',
          url: `https://www.instagram.com/${username}/`,
          format: 'json',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Successfully retrieved data from direct API');
        
        const result = data.result || data.data || data;
        return {
          username,
          bio: result.bio || result.description || '',
          posts: transformPosts(result.posts || []),
          followers: extractNumber(result.followers) || 0,
          following: extractNumber(result.following) || 0,
        };
      }
    }
  } catch (fallbackError) {
    console.error('❌ All fallback methods failed:', fallbackError);
  }

  // Final fallback to enhanced mock data
  console.log('📝 Using enhanced mock data (development mode)');
  return createEnhancedMockData(username);
}

function parseHTMLProfile(username: string, html: string): ProfileData {
  // Basic HTML parsing for Instagram profile
  // This is a simplified version - in production, you'd use a proper HTML parser
  try {
    const bioMatch = html.match(/<meta property="og:description" content="([^"]*)">/);
    const followersMatch = html.match(/(\d+(?:,\d+)*)\s*[Ff]ollowers/);
    const followingMatch = html.match(/(\d+(?:,\d+)*)\s*[Ff]ollowing/);

    return {
      username,
      bio: bioMatch ? bioMatch[1] : `Profile information for ${username}`,
      posts: [], // HTML parsing for posts would be more complex
      followers: followersMatch ? extractNumber(followersMatch[1]) : 0,
      following: followingMatch ? extractNumber(followingMatch[1]) : 0,
    };
  } catch (error) {
    console.error('❌ Error parsing HTML profile:', error);
    return createEnhancedMockData(username);
  }
}

function createEnhancedMockData(username: string): ProfileData {
  // Create more realistic mock data based on the username
  const mockProfiles = {
    emrata: {
      bio: "Model, activist, author of My Body. 📖 @inamoratawoman founder. Based in NYC & LA 🏙️",
      followers: 29200000,
      following: 1205,
      posts: [
        {
          caption: "Sunday in the studio working on new @inamoratawoman designs ✨ Always inspired by strong women and timeless silhouettes",
          likes: 284750,
          comments: [
            { text: "Obsessed with everything you create! 🔥", author: "fashion_lover_01", timestamp: new Date().toISOString() },
            { text: "Can't wait to see the new collection!", author: "styleinspo", timestamp: new Date().toISOString() },
          ],
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          caption: "Reading corner vibes with my latest book obsession 📚 What are you reading this week?",
          likes: 198430,
          comments: [
            { text: "Love seeing your book recommendations!", author: "bookworm_babe", timestamp: new Date().toISOString() },
            { text: "You inspire me to read more ❤️", author: "mindful_reader", timestamp: new Date().toISOString() },
          ],
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    natgeo: {
      bio: "Experience the world through the lens of National Geographic 🌍 Explore, discover, protect.",
      followers: 281000000,
      following: 135,
      posts: [
        {
          caption: "The Northern Lights dance across the Arctic sky in this breathtaking display of nature's power. Photographer @arctic_wanderer captured this magical moment in Iceland 🌌 #NorthernLights #Iceland #Photography",
          likes: 1284750,
          comments: [
            { text: "This is absolutely incredible! 😍", author: "nature_lover_23", timestamp: new Date().toISOString() },
            { text: "Iceland is on my bucket list now!", author: "travel_dreams", timestamp: new Date().toISOString() },
          ],
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          caption: "Deep beneath the ocean surface, a rare giant squid reveals itself to our research team. These mysterious creatures can grow up to 43 feet long and remain one of the ocean's greatest mysteries 🦑 #OceanExploration #MarineBiology",
          likes: 987430,
          comments: [
            { text: "Marine biology is so fascinating!", author: "ocean_explorer", timestamp: new Date().toISOString() },
            { text: "This is why we need to protect our oceans", author: "conservationist", timestamp: new Date().toISOString() },
          ],
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    default: {
      bio: `Creative individual passionate about sharing life's authentic moments. Based in ${getRandomCity()}`,
      followers: Math.floor(Math.random() * 50000) + 10000,
      following: Math.floor(Math.random() * 2000) + 500,
      posts: [
        {
          caption: `Just wrapped up an amazing project! Sometimes the best inspiration comes from unexpected places ✨`,
          likes: Math.floor(Math.random() * 5000) + 500,
          comments: [
            { text: "This is so inspiring! 🔥", author: "creative_friend", timestamp: new Date().toISOString() },
            { text: "Love your perspective!", author: "art_enthusiast", timestamp: new Date().toISOString() },
          ],
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          caption: `Sunday mood: coffee, creativity, and good vibes ☕️ What's everyone up to this weekend?`,
          likes: Math.floor(Math.random() * 3000) + 200,
          comments: [
            { text: "Perfect Sunday vibes!", author: "weekend_warrior", timestamp: new Date().toISOString() },
          ],
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
  };

  const profile = mockProfiles[username.toLowerCase() as keyof typeof mockProfiles] || mockProfiles.default;
  
  return {
    username,
    bio: `Mock bio for ${username} - ${profile.bio}`,
    posts: profile.posts,
    followers: profile.followers,
    following: profile.following,
  };
}

function getRandomCity(): string {
  const cities = ['NYC', 'LA', 'Miami', 'Chicago', 'Austin', 'Portland', 'Seattle', 'Denver'];
  return cities[Math.floor(Math.random() * cities.length)];
}

function transformPosts(posts: any[]): PostData[] {
  if (!Array.isArray(posts)) return [];
  
  return posts.map(post => ({
    caption: post.caption || post.description || post.text || '',
    likes: extractNumber(post.likes || post.like_count) || 0,
    comments: transformComments(post.comments || []),
    timestamp: post.timestamp || post.date_posted || post.created_at || new Date().toISOString(),
  }));
}

function transformComments(comments: any[]): CommentData[] {
  if (!Array.isArray(comments)) return [];
  
  return comments.map(comment => ({
    text: comment.comment || comment.text || comment.content || '',
    author: comment.comment_user || comment.author || comment.username || 'unknown',
    timestamp: comment.comment_date || comment.timestamp || comment.created_at || new Date().toISOString(),
  }));
}

function extractNumber(str: string | number): number {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  
  const strValue = str.toString().toLowerCase().replace(/,/g, '');
  
  // Handle K, M, B suffixes
  if (strValue.includes('k')) {
    return Math.floor(parseFloat(strValue) * 1000);
  }
  if (strValue.includes('m')) {
    return Math.floor(parseFloat(strValue) * 1000000);
  }
  if (strValue.includes('b')) {
    return Math.floor(parseFloat(strValue) * 1000000000);
  }
  
  const match = strValue.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
} 