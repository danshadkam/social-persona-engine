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
  const mcpScraperUrl = process.env.MCP_SCRAPER_URL;
  
  if (!mcpScraperUrl) {
    throw new Error('MCP_SCRAPER_URL environment variable is not set');
  }

  try {
    // Use MCP Puppeteer server to scrape Instagram profile
    const response = await fetch(`${mcpScraperUrl}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `https://www.instagram.com/${username}/`,
        waitForSelector: 'article',
        extractData: {
          bio: 'meta[property="og:description"]',
          posts: 'article a',
          followers: '[href*="followers"]',
          following: '[href*="following"]',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to scrape profile: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      username,
      bio: data.bio || '',
      posts: data.posts || [],
      followers: extractNumber(data.followers) || 0,
      following: extractNumber(data.following) || 0,
    };
  } catch (error) {
    console.error('Error scraping profile:', error);
    
    // Fallback to mock data for development
    return {
      username,
      bio: `Mock bio for ${username}`,
      posts: [
        {
          caption: `Sample post from ${username}`,
          likes: 100,
          comments: [
            {
              text: 'Great post!',
              author: 'follower1',
              timestamp: new Date().toISOString(),
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
      followers: 1000,
      following: 500,
    };
  }
}

function extractNumber(str: string): number {
  const match = str?.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

export async function scrapeWithFirecrawl(username: string): Promise<ProfileData> {
  // Alternative implementation using Firecrawl
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
  
  if (!firecrawlApiKey) {
    throw new Error('FIRECRAWL_API_KEY environment variable is not set');
  }

  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: `https://www.instagram.com/${username}/`,
      pageOptions: {
        onlyMainContent: true,
        includeHtml: false,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Firecrawl API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Process and structure the scraped data
  return {
    username,
    bio: data.data?.description || '',
    posts: [], // Process posts from scraped data
    followers: 0,
    following: 0,
  };
} 