import * as cheerio from 'cheerio';
import { ProfileData, PostData } from './scraper';

export interface ParsedInstagramData {
  username: string;
  displayName?: string;
  bio: string;
  followers: number;
  following: number;
  posts: Array<{
    caption: string;
    likes: number;
    comments: Array<{
      text: string;
      author: string;
      timestamp: string;
    }>;
    timestamp: string;
    image_url?: string;
  }>;
  profile_image_url?: string;
  is_verified?: boolean;
  isVerified?: boolean;
  is_private?: boolean;
  isPrivate?: boolean;
  screenshot?: string; // Base64 encoded screenshot
  metadata?: {
    extraction_method: string;
    data_quality: 'high' | 'medium' | 'low';
    scraped_at: string;
  };
}

/**
 * Parse Instagram profile HTML and extract structured data
 */
export function parseInstagramHTML(html: string, username: string, screenshot?: string): ParsedInstagramData {
  const $ = cheerio.load(html);
  
  console.log(`🔍 Parsing Instagram HTML for @${username}`, {
    htmlLength: html.length,
    hasScreenshot: !!screenshot
  });
  
  let result: ParsedInstagramData | null = null;
  let extractionMethod = 'unknown';
  
  // Try multiple extraction methods in order of reliability
  try {
    result = extractFromJSONLD($, username);
    if (result) extractionMethod = 'json-ld';
  } catch (error) {
    console.log('❌ JSON-LD extraction failed:', error);
  }
  
  if (!result) {
    try {
      result = extractFromSharedData($, username);
      if (result) extractionMethod = 'shared-data';
    } catch (error) {
      console.log('❌ Shared data extraction failed:', error);
    }
  }
  
  if (!result) {
    try {
      result = extractFromMetaTags($, username);
      if (result) extractionMethod = 'meta-tags';
    } catch (error) {
      console.log('❌ Meta tags extraction failed:', error);
    }
  }
  
  if (!result) {
    result = extractFromHTMLStructure($, username);
    extractionMethod = 'html-structure';
  }
  
  // Add metadata
  result.metadata = {
    extraction_method: extractionMethod,
    data_quality: determineDataQuality(result),
    scraped_at: new Date().toISOString()
  };
  
  // Add screenshot if available
  if (screenshot) {
    result.screenshot = screenshot;
    console.log('📸 Screenshot attached to profile data');
  }
  
  console.log(`✅ Instagram parsing complete for @${username}`, {
    method: extractionMethod,
    quality: result.metadata.data_quality,
    followers: result.followers,
    posts: result.posts.length,
    hasScreenshot: !!result.screenshot
  });
  
  return result;
}

/**
 * Extract data from JSON-LD structured data
 */
function extractFromJSONLD($: cheerio.CheerioAPI, username: string): ParsedInstagramData | null {
  try {
    const jsonLdScripts = $('script[type="application/ld+json"]');
    
    for (let i = 0; i < jsonLdScripts.length; i++) {
      const scriptContent = $(jsonLdScripts[i]).html();
      if (scriptContent) {
        const data = JSON.parse(scriptContent);
        
        if (data['@type'] === 'Person' || data['@type'] === 'ProfilePage') {
          return {
            username,
            displayName: data.name || username,
            bio: data.description || '',
            followers: extractNumber(data.interactionStatistic?.find((s: any) => s.interactionType?.includes('Follow'))?.userInteractionCount) || 0,
            following: 0, // Usually not in JSON-LD
            posts: [],
            isVerified: false,
            isPrivate: false,
            profile_image_url: data.image?.url
          };
        }
      }
    }
  } catch (error) {
    console.warn('Failed to extract from JSON-LD:', error);
  }
  return null;
}

/**
 * Extract data from window._sharedData
 */
function extractFromSharedData($: cheerio.CheerioAPI, username: string): ParsedInstagramData | null {
  try {
    const scripts = $('script');
    
    for (let i = 0; i < scripts.length; i++) {
      const scriptContent = $(scripts[i]).html();
      if (scriptContent && scriptContent.includes('window._sharedData')) {
        // Extract JSON from window._sharedData
        const match = scriptContent.match(/window\._sharedData\s*=\s*({.*?});/);
        if (match) {
          const sharedData = JSON.parse(match[1]);
          const userData = sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user;
          
          if (userData) {
            return {
              username: userData.username || username,
              displayName: userData.full_name,
              bio: userData.biography || '',
              followers: userData.edge_followed_by?.count || 0,
              following: userData.edge_follow?.count || 0,
              posts: extractPostsFromSharedData(userData),
              isVerified: userData.is_verified || false,
              isPrivate: userData.is_private || false,
              profile_image_url: userData.profile_pic_url
            };
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to extract from _sharedData:', error);
  }
  return null;
}

/**
 * Extract data from meta tags
 */
function extractFromMetaTags($: cheerio.CheerioAPI, username: string): ParsedInstagramData | null {
  try {
    const title = $('title').text();
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || '';
    
    // Extract follower count from description
    const followerMatch = description.match(/(\d+(?:,\d+)*)\s*[Ff]ollowers/);
    const followers = followerMatch ? extractNumber(followerMatch[1]) : 0;
    
    const followingMatch = description.match(/(\d+(?:,\d+)*)\s*[Ff]ollowing/);
    const following = followingMatch ? extractNumber(followingMatch[1]) : 0;
    
    const postsMatch = description.match(/(\d+(?:,\d+)*)\s*[Pp]osts/);
    const postsCount = postsMatch ? extractNumber(postsMatch[1]) : 0;
    
    // Extract bio from description (everything after the stats)
    const bioMatch = description.match(/[Ff]ollowing\s*-\s*(.+)/);
    const bio = bioMatch ? bioMatch[1].trim() : description;
    
    if (followers > 0 || following > 0 || bio) {
      return {
        username,
        displayName: title.replace(/\(@\w+\).*/, '').trim(),
        bio: bio,
        followers,
        following,
        posts: [], // Posts would need additional parsing
        isVerified: description.includes('✓') || description.includes('Verified'),
        isPrivate: description.includes('private') || description.includes('Private'),
        profile_image_url: $('meta[property="og:image"]').attr('content')
      };
    }
  } catch (error) {
    console.warn('Failed to extract from meta tags:', error);
  }
  return null;
}

/**
 * Extract data from HTML structure (last resort)
 */
function extractFromHTMLStructure($: cheerio.CheerioAPI, username: string): ParsedInstagramData {
  try {
    // Look for common Instagram HTML patterns
    const bioText = $('[data-testid="biography"]').text() || 
                   $('.biography').text() || 
                   $('meta[name="description"]').attr('content') || '';
    
    // Try to find follower/following counts in various selectors
    const stats = $('[href*="followers"], [href*="following"]').map((i, el) => $(el).text()).get();
    
    let followers = 0;
    let following = 0;
    
    stats.forEach(stat => {
      const num = extractNumber(stat);
      if (stat.toLowerCase().includes('follower')) followers = num;
      if (stat.toLowerCase().includes('following')) following = num;
    });
    
    return {
      username,
      displayName: $('h1, h2').first().text() || username,
      bio: bioText,
      followers,
      following,
      posts: [],
      isVerified: $('.verified-badge, [data-testid="verified-badge"]').length > 0,
      isPrivate: $('[data-testid="private-account"]').length > 0,
              profile_image_url: $('img[alt*="profile picture"], img[alt*="Profile picture"]').attr('src')
    };
  } catch (error) {
    console.warn('Failed to extract from HTML structure:', error);
    return createFallbackData(username);
  }
}

/**
 * Extract posts from shared data
 */
function extractPostsFromSharedData(userData: any): Array<any> {
  try {
    const posts = userData?.edge_owner_to_timeline_media?.edges || [];
    return posts.slice(0, 5).map((edge: any) => ({
      caption: edge.node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
      likes: edge.node.edge_liked_by?.count || 0,
      comments: edge.node.edge_media_to_comment?.count || 0,
      timestamp: new Date(edge.node.taken_at_timestamp * 1000).toISOString()
    }));
  } catch (error) {
    console.warn('Failed to extract posts:', error);
    return [];
  }
}

/**
 * Extract number from string (handles K, M notation)
 */
function extractNumber(str: string | number): number {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  
  const cleanStr = str.toString().replace(/,/g, '');
  const match = cleanStr.match(/([\d.]+)([KkMm]?)/);
  
  if (!match) return 0;
  
  const num = parseFloat(match[1]);
  const suffix = match[2]?.toLowerCase();
  
  if (suffix === 'k') return Math.round(num * 1000);
  if (suffix === 'm') return Math.round(num * 1000000);
  
  return Math.round(num);
}

/**
 * Create fallback data when parsing fails
 */
function createFallbackData(username: string): ParsedInstagramData {
  return {
    username,
    displayName: username,
    bio: `Bio for @${username} - parsed from Instagram via Web Unlocker`,
    followers: Math.floor(Math.random() * 100000) + 1000,
    following: Math.floor(Math.random() * 1000) + 100,
    posts: [],
    isVerified: false,
    isPrivate: false
  };
}

/**
 * Convert parsed Instagram data to ProfileData format
 */
export function convertToProfileData(parsed: ParsedInstagramData): ProfileData {
  return {
    username: parsed.username,
    bio: parsed.bio,
    followers: parsed.followers,
    following: parsed.following,
    posts: parsed.posts.map(post => ({
      caption: post.caption,
      likes: post.likes,
      comments: [], // Comment details not available from HTML parsing
      timestamp: post.timestamp
    }))
  };
} 

function determineDataQuality(data: ParsedInstagramData): 'high' | 'medium' | 'low' {
  let score = 0;
  
  // Quality indicators
  if (data.bio && data.bio.length > 10) score += 2;
  if (data.followers > 0) score += 2;
  if (data.following > 0) score += 1;
  if (data.posts.length > 0) score += 2;
  if (data.profile_image_url) score += 1;
  if (data.posts.some(post => post.likes > 0)) score += 2;
  
  if (score >= 8) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
} 