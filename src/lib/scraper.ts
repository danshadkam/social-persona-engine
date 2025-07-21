import { createWebUnlocker } from './mcp-config';

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
    // Try Web Unlocker if API key is available
    if (process.env.BRIGHT_DATA_API_KEY) {
      console.log('🌐 Attempting Web Unlocker...');
      const webUnlocker = createWebUnlocker();
      const result = await webUnlocker.scrapeInstagramProfile(username);
      
      if (result.status_code === 200 && result.body) {
        console.log('✅ Successfully retrieved data via Web Unlocker');
        return await processWebUnlockerData(result, username);
      }
    } else {
      console.log('⚠️ BRIGHT_DATA_API_KEY not found, using enhanced mock data');
    }
  } catch (error) {
    console.error('❌ Web Unlocker failed:', error);
    console.log('🔄 Falling back to enhanced mock data...');
  }

  // Fallback to enhanced mock data
  return createEnhancedMockData(username);
}

async function processWebUnlockerData(result: any, username: string): Promise<ProfileData> {
  console.log('🔄 Processing Web Unlocker HTML data...');
  
  try {
    const { parseInstagramHTML, convertToProfileData } = await import('./instagram-parser');
    const htmlContent = result.body;
    const screenshot = result.screenshot; // Pass screenshot to parser
    
    if (typeof htmlContent === 'string' && htmlContent.includes('<html')) {
      console.log('📊 Parsing Instagram HTML content...');
      const parsedData = parseInstagramHTML(htmlContent, username, screenshot);
      return convertToProfileData(parsedData);
    }
  } catch (error) {
    console.error('❌ HTML parsing failed:', error);
  }
  
  // Fallback if parsing fails
  console.log('🔄 HTML parsing failed, using enhanced mock data');
  return createEnhancedMockData(username);
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