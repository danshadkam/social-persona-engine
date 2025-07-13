import { NextApiRequest, NextApiResponse } from 'next';
import { generateChatResponse } from '@/lib/chat';
import { getAnalysis } from '@/lib/memory';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, username, analysis } = req.body;

  if (!message || !username) {
    return res.status(400).json({ error: 'Message and username are required' });
  }

  try {
    // Get analysis from memory if not provided
    const personalityAnalysis = analysis || await getAnalysis(username);
    
    if (!personalityAnalysis) {
      return res.status(404).json({ error: 'Profile analysis not found. Please analyze the profile first.' });
    }

    // Generate chat response using the personality analysis
    const response = await generateChatResponse(message, personalityAnalysis);
    
    res.status(200).json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Failed to generate chat response' });
  }
} 