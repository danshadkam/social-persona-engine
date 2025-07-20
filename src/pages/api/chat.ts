import { NextApiRequest, NextApiResponse } from 'next';
import { enhancedMemory, ConversationMessage } from '@/lib/memory-enhanced';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, username } = req.body;

  if (!message || !username) {
    return res.status(400).json({ error: 'Message and username are required' });
  }

  try {
    // IMMEDIATE FIX - Force reload memory on every chat request
    try {
      await enhancedMemory.forceReload();
      console.log('🔄 Memory force reloaded for chat request');
    } catch (reloadError) {
      console.warn('⚠️ Memory reload failed:', reloadError);
    }

    console.log(`💬 Chat request from user to @${username}: "${message.substring(0, 50)}..."`);
    
    // Enhanced profile retrieval with auto-recovery
    let profile = await enhancedMemory.getProfile(username);
    
    // Auto-recovery: If profile not found, try multiple recovery methods
    if (!profile) {
      console.log(`🔄 Profile ${username} not found, attempting auto-recovery...`);
      
      // Method 1: Force reload from file
      try {
        await enhancedMemory.forceReload();
        profile = await enhancedMemory.getProfile(username);
        if (profile) {
          console.log(`✅ Profile ${username} recovered via force reload`);
        }
      } catch (reloadError) {
        console.error('❌ Force reload failed:', reloadError);
      }
      
      // Method 2: Auto re-analysis if still not found
      if (!profile) {
        console.log(`🔄 Attempting auto re-analysis for ${username}...`);
        try {
          const analyzeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
          });
          
          if (analyzeResponse.ok) {
            console.log(`✅ Auto re-analysis successful for ${username}`);
            profile = await enhancedMemory.getProfile(username);
          }
        } catch (autoAnalyzeError) {
          console.error('❌ Auto re-analysis failed:', autoAnalyzeError);
        }
      }
    }
    
    // If still no profile after all recovery attempts
    if (!profile) {
      const memoryStats = enhancedMemory.getMemoryStats();
      console.log(`❌ Profile ${username} still not found after all recovery attempts`);
      console.log(`🔍 Available profiles: ${memoryStats.keys.join(', ')}`);
      
      return res.status(400).json({ 
        error: 'Profile analysis not found. Please analyze the profile first.',
        suggestion: 'Click the "Analyze" tab to analyze the Instagram profile before chatting.',
        autoRecoveryAttempted: true,
        availableProfiles: memoryStats.keys,
        requestedProfile: username
      });
    }

    console.log(`✅ Profile found for ${username}, proceeding with chat...`);
    
    // Add user message to conversation history
    const userMessage: ConversationMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    await enhancedMemory.addConversationMessage(username, userMessage);

    // Get relevant context using embeddings
    const contextualPrompt = await enhancedMemory.getRelevantContext(username, message);
    console.log(`🧠 Retrieved contextual prompt for @${username} (${contextualPrompt.length} chars)`);

    // Generate response using enhanced context
    const response = await generateEnhancedChatResponse(message, contextualPrompt);
    console.log(`✅ Generated response for @${username}: "${response.substring(0, 50)}..."`);

    // Add assistant response to conversation history
    const assistantMessage: ConversationMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    };
    
    await enhancedMemory.addConversationMessage(username, assistantMessage);

    res.status(200).json({ 
      response,
      metadata: {
        conversationLength: profile.conversationHistory.length + 2, // +2 for the new messages
        dataSource: profile.realDataUsed ? 'real_instagram_data' : 'fallback_data',
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Error in chat endpoint:', errorMessage);
    
    res.status(500).json({ 
      error: 'Failed to generate chat response',
      details: errorMessage,
      fallbackResponse: "Hey! I'm having some technical difficulties right now, but I'd love to chat more. Can you try asking me something else?"
    });
  }
}

async function generateEnhancedChatResponse(
  userMessage: string,
  contextualPrompt: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: contextualPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return content;
  } catch (error) {
    console.error('Error generating enhanced chat response:', error);
    
    // Intelligent fallback based on user message content
    if (userMessage.toLowerCase().includes('hotel') || userMessage.toLowerCase().includes('travel')) {
      return "I love talking about travel! I'm always planning my next adventure. What's your favorite destination?";
    } else if (userMessage.toLowerCase().includes('photo') || userMessage.toLowerCase().includes('picture')) {
      return "Photography is such a passion of mine! I love capturing moments that tell a story. What kind of photos do you enjoy taking?";
    } else {
      return "That's such an interesting question! I'd love to hear more about what you're thinking. Tell me what's on your mind! 😊";
    }
  }
} 