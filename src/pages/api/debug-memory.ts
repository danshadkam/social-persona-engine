import { NextApiRequest, NextApiResponse } from 'next';
import { enhancedMemory } from '@/lib/memory-enhanced';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.query;

  try {
    if (username && typeof username === 'string') {
      // Get specific profile
      const profile = await enhancedMemory.getProfile(username);
      return res.status(200).json({
        username,
        found: !!profile,
        profile: profile ? {
          username: profile.username,
          realDataUsed: profile.realDataUsed,
          lastUpdated: profile.lastUpdated,
          conversationHistoryLength: profile.conversationHistory.length,
          personalityTraits: profile.personalityAnalysis.traits,
          bio: profile.rawProfileData.bio.substring(0, 100) + '...',
          followers: profile.rawProfileData.followers,
        } : null,
      });
    } else {
      // Get all profiles
      const allProfiles = await enhancedMemory.getAllProfiles();
      const profileSummaries = Object.keys(allProfiles).map(key => ({
        username: key,
        realDataUsed: allProfiles[key].realDataUsed,
        lastUpdated: allProfiles[key].lastUpdated,
        conversationHistoryLength: allProfiles[key].conversationHistory.length,
      }));

      return res.status(200).json({
        totalProfiles: Object.keys(allProfiles).length,
        profiles: profileSummaries,
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Error in debug-memory endpoint:', errorMessage);
    
    res.status(500).json({ 
      error: 'Failed to debug memory',
      details: errorMessage,
    });
  }
} 