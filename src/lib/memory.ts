import { PersonalityAnalysis } from './agent';

// In-memory storage for development
// In production, replace with a database like Redis, PostgreSQL, etc.
const memoryStore = new Map<string, PersonalityAnalysis | string>();

export async function saveAnalysis(username: string, analysis: PersonalityAnalysis): Promise<void> {
  try {
    // Store in memory
    memoryStore.set(username.toLowerCase(), analysis);
    
    // Optional: Add timestamp for expiration
    const key = `${username.toLowerCase()}:timestamp`;
    memoryStore.set(key, new Date().toISOString());
    
    console.log(`Analysis saved for user: ${username}`);
  } catch (error) {
    console.error('Error saving analysis:', error);
    throw new Error('Failed to save analysis');
  }
}

export async function getAnalysis(username: string): Promise<PersonalityAnalysis | null> {
  try {
    const analysis = memoryStore.get(username.toLowerCase());
    
    if (!analysis || typeof analysis === 'string') {
      return null;
    }

    // Check if analysis is expired (optional: 24 hours)
    const timestampKey = `${username.toLowerCase()}:timestamp`;
    const timestamp = memoryStore.get(timestampKey);
    
    if (timestamp && typeof timestamp === 'string') {
      const savedTime = new Date(timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        // Analysis expired, remove from memory
        memoryStore.delete(username.toLowerCase());
        memoryStore.delete(timestampKey);
        return null;
      }
    }

    return analysis;
  } catch (error) {
    console.error('Error getting analysis:', error);
    return null;
  }
}

export async function deleteAnalysis(username: string): Promise<void> {
  try {
    memoryStore.delete(username.toLowerCase());
    memoryStore.delete(`${username.toLowerCase()}:timestamp`);
    console.log(`Analysis deleted for user: ${username}`);
  } catch (error) {
    console.error('Error deleting analysis:', error);
    throw new Error('Failed to delete analysis');
  }
}

export async function getAllAnalyses(): Promise<Record<string, PersonalityAnalysis>> {
  try {
    const analyses: Record<string, PersonalityAnalysis> = {};
    
    for (const [key, value] of memoryStore.entries()) {
      if (!key.includes(':timestamp') && typeof value === 'object') {
        analyses[key] = value as PersonalityAnalysis;
      }
    }
    
    return analyses;
  } catch (error) {
    console.error('Error getting all analyses:', error);
    return {};
  }
}

// Database implementation example (for production use)
// Example database implementation for production use
// This is commented out to avoid TypeScript errors since it's just an example
/*
export class DatabaseMemory {
  private connection: any; // Replace with actual database connection
  
  constructor(connection: any) {
    this.connection = connection;
  }

  async saveAnalysis(username: string, analysis: PersonalityAnalysis): Promise<void> {
    // Example with PostgreSQL
    const query = `
      INSERT INTO personality_analyses (username, traits, communication_style, interests, values, summary, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (username) DO UPDATE SET
        traits = $2,
        communication_style = $3,
        interests = $4,
        values = $5,
        summary = $6,
        updated_at = NOW()
    `;
    
    await this.connection.query(query, [
      username.toLowerCase(),
      JSON.stringify(analysis.traits),
      analysis.communication_style,
      JSON.stringify(analysis.interests),
      JSON.stringify(analysis.values),
      analysis.summary,
    ]);
  }

  async getAnalysis(username: string): Promise<PersonalityAnalysis | null> {
    const query = `
      SELECT * FROM personality_analyses 
      WHERE username = $1 AND created_at > NOW() - INTERVAL '24 hours'
    `;
    
    const result = await this.connection.query(query, [username.toLowerCase()]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      traits: JSON.parse(row.traits),
      communication_style: row.communication_style,
      interests: JSON.parse(row.interests),
      values: JSON.parse(row.values),
      summary: row.summary,
    };
  }
}
*/ 