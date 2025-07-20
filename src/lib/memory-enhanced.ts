import OpenAI from 'openai';
import { PersonalityAnalysis } from './agent';
import { ProfileData } from './scraper';
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced memory interfaces
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  embedding?: number[];
}

export interface EnhancedProfile {
  username: string;
  personalityAnalysis: PersonalityAnalysis;
  rawProfileData: ProfileData;
  conversationHistory: ConversationMessage[];
  contextEmbeddings: number[][];
  lastUpdated: string;
  realDataUsed: boolean; // Track if we're using real scraped data or fallback
}

// In-memory storage with enhanced context
const enhancedMemoryStore = new Map<string, EnhancedProfile>();

// File-based persistence for development
const MEMORY_FILE = path.join(process.cwd(), '.memory-cache.json');

function loadFromFile(): void {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const data = fs.readFileSync(MEMORY_FILE, 'utf8');
      const profiles = JSON.parse(data);
      enhancedMemoryStore.clear();
      Object.entries(profiles).forEach(([key, profile]) => {
        enhancedMemoryStore.set(key, profile as EnhancedProfile);
      });
      console.log(`💾 Loaded ${enhancedMemoryStore.size} profiles from cache`);
    }
  } catch (error) {
    console.warn('Failed to load memory cache:', error);
  }
}

function saveToFile(): void {
  try {
    const profiles = Object.fromEntries(enhancedMemoryStore);
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(profiles, null, 2));
  } catch (error) {
    console.warn('Failed to save memory cache:', error);
  }
}

// Load existing data on module initialization
loadFromFile();

export class EnhancedMemorySystem {
  
  async saveProfile(
    username: string, 
    personalityAnalysis: PersonalityAnalysis, 
    rawProfileData: ProfileData
  ): Promise<void> {
    try {
      // Determine if we're using real data or fallback
      const realDataUsed = !rawProfileData.bio.includes('Mock');
      
      // Create embeddings for the personality analysis (with fallback)
      let embedding: number[] = [];
      try {
        const contextText = this.createContextText(personalityAnalysis, rawProfileData);
        embedding = await this.createEmbedding(contextText);
      } catch (embeddingError) {
        console.warn('Failed to create embedding, using empty array:', embeddingError);
        embedding = [];
      }
      
      const enhancedProfile: EnhancedProfile = {
        username: username.toLowerCase(),
        personalityAnalysis,
        rawProfileData,
        conversationHistory: [],
        contextEmbeddings: embedding.length > 0 ? [embedding] : [],
        lastUpdated: new Date().toISOString(),
        realDataUsed,
      };

      enhancedMemoryStore.set(username.toLowerCase(), enhancedProfile);
      saveToFile(); // Persist to file
      
      console.log(`✅ Enhanced profile saved for ${username} (Real data: ${realDataUsed}, Embedding: ${embedding.length > 0 ? 'Yes' : 'No'})`);
    } catch (error) {
      console.error('❌ Error saving enhanced profile:', error);
      throw new Error('Failed to save enhanced profile');
    }
  }

  async getProfile(username: string): Promise<EnhancedProfile | null> {
    try {
      const key = username.toLowerCase();
      const profile = enhancedMemoryStore.get(key);
      
      if (!profile) {
        return null;
      }

      // Check if profile is expired (24 hours)
      const lastUpdated = new Date(profile.lastUpdated);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        enhancedMemoryStore.delete(key);
        saveToFile(); // Update file
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error getting enhanced profile:', error);
      return null;
    }
  }

  async addConversationMessage(
    username: string, 
    message: ConversationMessage
  ): Promise<void> {
    try {
      const profile = await this.getProfile(username);
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Try to create embedding for the message (optional)
      try {
        const embedding = await this.createEmbedding(message.content);
        if (embedding.length > 0) {
          message.embedding = embedding;
        }
      } catch (embeddingError) {
        console.warn('Failed to create embedding for message, continuing without:', embeddingError);
      }

      // Add to conversation history
      profile.conversationHistory.push(message);
      
      // Keep only last 20 messages for performance
      if (profile.conversationHistory.length > 20) {
        profile.conversationHistory = profile.conversationHistory.slice(-20);
      }

      // Update context embeddings if available
      if (message.embedding && message.embedding.length > 0) {
        profile.contextEmbeddings.push(message.embedding);
        
        // Keep only last 10 embeddings for performance
        if (profile.contextEmbeddings.length > 10) {
          profile.contextEmbeddings = profile.contextEmbeddings.slice(-10);
        }
      }

      enhancedMemoryStore.set(username.toLowerCase(), profile);
      saveToFile(); // Persist to file
      
      console.log(`💬 Message added to conversation for ${username} (${profile.conversationHistory.length} total messages)`);
    } catch (error) {
      console.error('❌ Error adding conversation message:', error);
      throw new Error('Failed to add conversation message');
    }
  }

  async getRelevantContext(username: string, userMessage: string): Promise<string> {
    try {
      const profile = await this.getProfile(username);
      if (!profile) {
        return '';
      }

      let relevantMessages = '';
      
      // Try to use embeddings for context similarity, but fallback if unavailable
      try {
        const messageEmbedding = await this.createEmbedding(userMessage);
        
        if (messageEmbedding.length > 0) {
          // Find most relevant past conversations using cosine similarity
          relevantMessages = profile.conversationHistory
            .filter(msg => msg.embedding && msg.embedding.length > 0)
            .map(msg => ({
              message: msg,
              similarity: this.cosineSimilarity(messageEmbedding, msg.embedding!),
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 3) // Top 3 most relevant messages
            .map(item => `${item.message.role}: ${item.message.content}`)
            .join('\n');
        }
      } catch (embeddingError) {
        console.warn('Failed to create embeddings for context, using simple approach:', embeddingError);
      }

      // Fallback: use recent conversation history if embeddings failed
      if (!relevantMessages && profile.conversationHistory.length > 0) {
        relevantMessages = profile.conversationHistory
          .slice(-3) // Last 3 messages
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');
      }

      // Create comprehensive context
      const context = this.createDetailedContext(profile, relevantMessages);
      
      return context;
    } catch (error) {
      console.error('❌ Error getting relevant context:', error);
      return '';
    }
  }

  private async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private createContextText(analysis: PersonalityAnalysis, profileData: ProfileData): string {
    return `
      Username: ${profileData.username}
      Bio: ${profileData.bio}
      Followers: ${profileData.followers}
      Following: ${profileData.following}
      
      Personality Traits: ${analysis.traits.join(', ')}
      Communication Style: ${analysis.communication_style}
      Interests: ${analysis.interests.join(', ')}
      Values: ${analysis.values.join(', ')}
      
      Recent Posts:
      ${profileData.posts.slice(0, 3).map(post => 
        `Caption: ${post.caption}\nLikes: ${post.likes}`
      ).join('\n\n')}
    `;
  }

  private createDetailedContext(profile: EnhancedProfile, relevantMessages: string): string {
    const { personalityAnalysis, rawProfileData } = profile;
    
    return `
PERSONALITY PROFILE FOR ${rawProfileData.username.toUpperCase()}:

REAL DATA STATUS: ${profile.realDataUsed ? 'USING ACTUAL INSTAGRAM DATA' : 'USING FALLBACK DATA - LIMITED ACCURACY'}

BIO: ${rawProfileData.bio}
FOLLOWERS: ${rawProfileData.followers.toLocaleString()}
FOLLOWING: ${rawProfileData.following.toLocaleString()}

PERSONALITY ANALYSIS:
- Traits: ${personalityAnalysis.traits.join(', ')}
- Communication Style: ${personalityAnalysis.communication_style}
- Core Interests: ${personalityAnalysis.interests.join(', ')}
- Values: ${personalityAnalysis.values.join(', ')}

RECENT POSTS ANALYSIS:
${rawProfileData.posts.slice(0, 2).map(post => 
  `• "${post.caption.substring(0, 100)}${post.caption.length > 100 ? '...' : ''}" (${post.likes} likes)`
).join('\n')}

CONVERSATION CONTEXT (Most Relevant):
${relevantMessages}

INSTRUCTIONS:
- Respond as ${rawProfileData.username} would, using their specific personality traits and communication style
- Reference their actual interests, values, and recent posts when relevant
- Maintain consistency with their established personality
- ${profile.realDataUsed ? 'Use specific details from their real Instagram activity' : 'Note: Limited data available, use general personality framework'}
- Keep responses conversational and authentic to their character
`;
  }

  async deleteProfile(username: string): Promise<void> {
    enhancedMemoryStore.delete(username.toLowerCase());
    saveToFile(); // Update file
    console.log(`Enhanced profile deleted for ${username}`);
  }

  async getAllProfiles(): Promise<Record<string, EnhancedProfile>> {
    const profiles: Record<string, EnhancedProfile> = {};
    for (const [key, value] of enhancedMemoryStore.entries()) {
      profiles[key] = value;
    }
    return profiles;
  }
}

// Export singleton instance
export const enhancedMemory = new EnhancedMemorySystem(); 