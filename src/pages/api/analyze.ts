import { NextApiRequest, NextApiResponse } from 'next';
import { scrapeProfile } from '@/lib/scraper';
import { analyzePersonality } from '@/lib/agent';
import { enhancedMemory } from '@/lib/memory-enhanced';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    console.log(`🔍 Starting analysis for @${username}`);
    
    // Scrape Instagram profile with enhanced logging
    const profileData = await scrapeProfile(username);
    console.log(`📊 Profile data retrieved for @${username}:`, {
      bioLength: profileData.bio.length,
      postsCount: profileData.posts.length,
      followers: profileData.followers,
      isRealData: !profileData.bio.includes('Mock')
    });
    
    // Analyze personality using GPT with the scraped data
    const analysis = await analyzePersonality(profileData);
    console.log(`🧠 Personality analysis completed for @${username}:`, {
      traitsCount: analysis.traits.length,
      hasCommStyle: !!analysis.communication_style,
      interestsCount: analysis.interests.length
    });
    
    // Save analysis and profile data to enhanced memory system
    await enhancedMemory.saveProfile(username, analysis, profileData);
    console.log(`💾 Enhanced profile saved for @${username}`);
    
    // Return the analysis with additional metadata
    res.status(200).json({
      ...analysis,
      metadata: {
        username: profileData.username,
        followers: profileData.followers,
        following: profileData.following,
        postsAnalyzed: profileData.posts.length,
        dataSource: profileData.bio.includes('Mock') ? 'fallback' : 'instagram',
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Error in analyze endpoint:', errorMessage);
    
    res.status(500).json({ 
      error: 'Failed to analyze profile', 
      details: errorMessage,
      suggestions: [
        'Check your internet connection',
        'Verify the Instagram username exists and is public',
        'Ensure API tokens are correctly configured',
        'Try again in a few moments'
      ]
    });
  }
} 