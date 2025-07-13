import { NextApiRequest, NextApiResponse } from 'next';
import { scrapeProfile } from '@/lib/scraper';
import { analyzePersonality } from '@/lib/agent';
import { saveAnalysis } from '@/lib/memory';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    // Scrape Instagram profile
    const profileData = await scrapeProfile(username);
    
    // Analyze personality using GPT
    const analysis = await analyzePersonality(profileData);
    
    // Save analysis to memory
    await saveAnalysis(username, analysis);
    
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error in analyze endpoint:', error);
    res.status(500).json({ error: 'Failed to analyze profile' });
  }
} 