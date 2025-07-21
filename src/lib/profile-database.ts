import fs from 'fs/promises';
import path from 'path';
import { ProfileData } from './scraper';

export interface DatabaseProfile {
  username: string;
  analyzedAt: string;
  lastUpdated: string;
  
  // Core profile data
  profile: {
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
      imageUrl?: string;
      videoUrl?: string;
    }>;
    profileImageUrl?: string;
    isVerified: boolean;
    isPrivate: boolean;
  };
  
  // LLM-optimized analysis
  analysis: {
    personality_traits: string[];
    communication_style: {
      type: string;
      description: string;
      tone: string;
      emoji_usage: 'high' | 'medium' | 'low' | 'none';
    };
    interests: string[];
    values: string[];
    content_themes: string[];
    posting_patterns: {
      frequency: string;
      best_performing_content: string;
      engagement_style: string;
    };
    demographic_indicators: {
      likely_age_range: string;
      location_hints: string[];
      profession_hints: string[];
    };
  };
  
  // Visual analysis data
  visual_data: {
    profile_image: {
      url?: string;
      description?: string;
      style_analysis?: string;
    };
    post_images: Array<{
      url: string;
      caption: string;
      visual_themes: string[];
      color_palette: string[];
      composition_style: string;
      content_type: 'selfie' | 'lifestyle' | 'product' | 'art' | 'nature' | 'other';
    }>;
    visual_consistency: {
      filter_style: string;
      color_scheme: string;
      aesthetic_score: number;
    };
  };
  
  // Chat context data (LLM-optimized)
  chat_context: {
    personality_summary: string;
    speaking_style_examples: string[];
    key_topics: string[];
    response_patterns: string[];
    conversation_starters: string[];
  };
  
  // Metadata
  metadata: {
    data_source: 'real_scraped' | 'web_unlocker_parsed' | 'fallback_enhanced';
    scraping_success: boolean;
    analysis_confidence: number;
    embedding_vector?: number[];
    last_chat_interaction?: string;
    total_chat_messages: number;
  };
}

export class ProfileDatabase {
  private dbPath: string;
  private profiles: Map<string, DatabaseProfile> = new Map();
  private initialized = false;

  constructor(dbPath: string = './profile-database') {
    this.dbPath = path.resolve(dbPath);
  }

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure database directory exists
      await fs.mkdir(this.dbPath, { recursive: true });
      
      // Load existing profiles
      await this.loadAllProfiles();
      
      this.initialized = true;
      console.log(`📁 Profile database initialized at ${this.dbPath}`);
      console.log(`📊 Loaded ${this.profiles.size} existing profiles`);
    } catch (error) {
      console.error('❌ Failed to initialize profile database:', error);
      throw error;
    }
  }

  /**
   * Save a profile to the database
   */
  async saveProfile(profile: DatabaseProfile): Promise<void> {
    await this.initialize();
    
    try {
      // Update in-memory cache
      this.profiles.set(profile.username, profile);
      
      // Save to file
      const filePath = path.join(this.dbPath, `${profile.username}.json`);
      const profileJson = JSON.stringify(profile, null, 2);
      await fs.writeFile(filePath, profileJson, 'utf8');
      
      console.log(`💾 Profile saved to database: @${profile.username}`);
    } catch (error) {
      console.error(`❌ Failed to save profile ${profile.username}:`, error);
      throw error;
    }
  }

  /**
   * Get a profile from the database
   */
  async getProfile(username: string): Promise<DatabaseProfile | null> {
    await this.initialize();
    
    // Check in-memory cache first
    const cachedProfile = this.profiles.get(username);
    if (cachedProfile) {
      return cachedProfile;
    }
    
    // Try to load from file
    try {
      const filePath = path.join(this.dbPath, `${username}.json`);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const profile = JSON.parse(fileContent) as DatabaseProfile;
      
      // Cache in memory
      this.profiles.set(username, profile);
      
      return profile;
    } catch (error) {
      // Profile doesn't exist
      return null;
    }
  }

  /**
   * Check if a profile exists
   */
  async hasProfile(username: string): Promise<boolean> {
    const profile = await this.getProfile(username);
    return profile !== null;
  }

  /**
   * Get all profiles
   */
  async getAllProfiles(): Promise<DatabaseProfile[]> {
    await this.initialize();
    return Array.from(this.profiles.values());
  }

  /**
   * Update profile's chat metadata
   */
  async updateChatMetadata(username: string, messageCount: number): Promise<void> {
    const profile = await this.getProfile(username);
    if (profile) {
      profile.metadata.last_chat_interaction = new Date().toISOString();
      profile.metadata.total_chat_messages = messageCount;
      await this.saveProfile(profile);
    }
  }

  /**
   * Create LLM-optimized chat context
   */
  getLLMChatContext(profile: DatabaseProfile): string {
    return `
PROFILE ANALYSIS FOR @${profile.username}:

PERSONALITY & COMMUNICATION:
- Traits: ${profile.analysis.personality_traits.join(', ')}
- Communication Style: ${profile.analysis.communication_style.description}
- Tone: ${profile.analysis.communication_style.tone}
- Emoji Usage: ${profile.analysis.communication_style.emoji_usage}

INTERESTS & VALUES:
- Interests: ${profile.analysis.interests.join(', ')}
- Values: ${profile.analysis.values.join(', ')}
- Content Themes: ${profile.analysis.content_themes.join(', ')}

SOCIAL PRESENCE:
- Followers: ${profile.profile.followers.toLocaleString()}
- Following: ${profile.profile.following.toLocaleString()}
- Verified: ${profile.profile.isVerified ? 'Yes' : 'No'}
- Bio: "${profile.profile.bio}"

RECENT CONTENT:
${profile.profile.posts.slice(0, 3).map((post, i) => 
  `${i+1}. "${post.caption.substring(0, 100)}..." (${post.likes.toLocaleString()} likes)`
).join('\n')}

CONVERSATION GUIDANCE:
- Personality Summary: ${profile.chat_context.personality_summary}
- Key Topics: ${profile.chat_context.key_topics.join(', ')}
- Speaking Style: ${profile.chat_context.speaking_style_examples.join(' | ')}

You should respond as this person would, maintaining their personality, communication style, and interests.
    `.trim();
  }

  /**
   * Convert ProfileData to DatabaseProfile
   */
  static createDatabaseProfile(
    username: string,
    profileData: ProfileData,
    analysis: any,
    dataSource: DatabaseProfile['metadata']['data_source'] = 'fallback_enhanced'
  ): DatabaseProfile {
    const now = new Date().toISOString();
    
    return {
      username,
      analyzedAt: now,
      lastUpdated: now,
      
      profile: {
        bio: profileData.bio,
        followers: profileData.followers,
        following: profileData.following,
        posts: profileData.posts.map(post => ({
          caption: post.caption,
          likes: post.likes,
          comments: post.comments || [],
          timestamp: post.timestamp,
          imageUrl: undefined, // To be added with visual analysis
          videoUrl: undefined
        })),
        profileImageUrl: undefined, // To be added with visual analysis
        isVerified: false, // Default, can be updated from HTML parsing
        isPrivate: false
      },
      
      analysis: {
        personality_traits: analysis.traits || analysis.personality_traits || [],
        communication_style: {
          type: analysis.communication_style?.type || 'friendly',
          description: analysis.communication_style?.description || analysis.communication_style || '',
          tone: analysis.communication_style?.tone || 'positive',
          emoji_usage: analysis.communication_style?.emoji_usage || 'medium'
        },
        interests: analysis.interests || [],
        values: analysis.values || [],
        content_themes: analysis.content_themes || [],
        posting_patterns: {
          frequency: 'regular',
          best_performing_content: 'lifestyle posts',
          engagement_style: 'interactive'
        },
        demographic_indicators: {
          likely_age_range: '25-35',
          location_hints: [],
          profession_hints: []
        }
      },
      
      visual_data: {
        profile_image: {
          description: 'Professional headshot with warm lighting',
          style_analysis: 'Clean, modern aesthetic'
        },
        post_images: [],
        visual_consistency: {
          filter_style: 'natural',
          color_scheme: 'warm tones',
          aesthetic_score: 0.8
        }
      },
      
      chat_context: {
        personality_summary: analysis.summary || `Creative and engaging individual with focus on ${(analysis.interests || []).slice(0, 2).join(' and ')}`,
        speaking_style_examples: [
          "I love to share authentic moments",
          "Always excited about new projects",
          "Life is all about finding inspiration"
        ],
        key_topics: analysis.interests || [],
        response_patterns: [
          "Enthusiastic and positive",
          "Uses emojis naturally",
          "Shares personal experiences"
        ],
        conversation_starters: [
          "What's inspiring you today?",
          "Tell me about your latest project",
          "What's your creative process like?"
        ]
      },
      
      metadata: {
        data_source: dataSource,
        scraping_success: dataSource !== 'fallback_enhanced',
        analysis_confidence: dataSource === 'real_scraped' ? 0.9 : 0.7,
        embedding_vector: undefined,
        total_chat_messages: 0
      }
    };
  }

  private async loadAllProfiles(): Promise<void> {
    try {
      const files = await fs.readdir(this.dbPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.dbPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const profile = JSON.parse(content) as DatabaseProfile;
          this.profiles.set(profile.username, profile);
        } catch (error) {
          console.warn(`⚠️ Failed to load profile from ${file}:`, error);
        }
      }
    } catch (error) {
      // Directory doesn't exist yet, that's fine
    }
  }
}

// Global database instance
export const profileDatabase = new ProfileDatabase(); 