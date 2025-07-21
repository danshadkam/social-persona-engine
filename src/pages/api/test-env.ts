import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const hasApiKey = !!process.env.BRIGHT_DATA_API_KEY;
  const apiKeyLength = process.env.BRIGHT_DATA_API_KEY?.length || 0;
  const zone = process.env.BRIGHT_DATA_WEB_UNLOCKER_ZONE;
  
  res.status(200).json({
    timestamp: new Date().toISOString(),
    environment: {
      hasApiKey,
      apiKeyLength,
      zone,
      nodeEnv: process.env.NODE_ENV,
    },
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('BRIGHT_DATA')),
  });
} 