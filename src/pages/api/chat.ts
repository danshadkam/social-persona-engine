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
    console.log(`💬 Chat request from user to @${username}: "${message.substring(0, 50)}..."`);
    
    // Get enhanced profile with conversation context
    const profile = await enhancedMemory.getProfile(username);
    
    if (!profile) {
      return res.status(400).json({ 
        error: 'Profile analysis not found. Please analyze the profile first.',
        suggestion: 'Click the "Analyze" tab to analyze the Instagram profile before chatting.'
      });
    }

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