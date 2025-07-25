import { NextApiRequest, NextApiResponse } from 'next';
import { enhancedMemory, ConversationMessage } from '@/lib/memory-enhanced';
import { profileDatabase } from '@/lib/profile-database';
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
    
    // Try to get profile from new database system first
    let databaseProfile = await profileDatabase.getProfile(username);
    
    // If not found in database, try auto-analysis
    if (!databaseProfile) {
      console.log(`🔄 Profile ${username} not found in database, triggering auto-analysis...`);
      
      try {
        // Call analyze API to create the profile
        const analyzeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });
        
        if (analyzeResponse.ok) {
          const analyzeData = await analyzeResponse.json();
          console.log(`✅ Auto-analysis successful for ${username}:`, {
            success: analyzeData.success,
            cached: analyzeData.cached,
            hasProfile: !!analyzeData.profile
          });
          
          // Wait a moment for the database save to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          databaseProfile = await profileDatabase.getProfile(username);
          
          if (databaseProfile) {
            console.log(`✅ Profile successfully retrieved from database for ${username}`);
          } else {
            console.warn(`⚠️ Profile not found in database after analysis for ${username}`);
          }
        } else {
          const errorData = await analyzeResponse.json();
          console.error('❌ Auto-analysis HTTP error:', {
            status: analyzeResponse.status,
            statusText: analyzeResponse.statusText,
            error: errorData
          });
        }
      } catch (autoAnalyzeError) {
        console.error('❌ Auto-analysis request failed:', autoAnalyzeError);
      }
    }
    
    // If still no profile, return helpful error
    if (!databaseProfile) {
      console.log(`❌ Profile ${username} still not found after auto-analysis attempt`);
      
      // Get available profiles for suggestion
      const allProfiles = await profileDatabase.getAllProfiles();
      const availableUsernames = allProfiles.map(p => p.username);
      
      return res.status(400).json({ 
        error: `Profile @${username} not found. Please analyze the profile first.`,
        suggestion: 'Go to the "Analyze" tab and enter the Instagram username to analyze the profile before chatting.',
        autoAnalysisAttempted: true,
        availableProfiles: availableUsernames.slice(0, 5), // Show first 5 as examples
        requestedProfile: username
      });
    }

    console.log(`✅ Profile found for ${username}, proceeding with chat...`);
    
    // For new database profiles, use simplified conversation handling
    // Legacy memory system is only used for backward compatibility with old profiles
    let conversation: any[] = [];
    
    try {
      const legacyProfile = await enhancedMemory.getProfile(username);
      if (legacyProfile) {
        conversation = legacyProfile.conversationHistory || [];
        console.log(`📚 Using legacy memory system for ${username}`);
      } else {
        console.log(`📊 Using simplified conversation handling for new profile: ${username}`);
      }
    } catch (error) {
      console.log(`⚠️ Legacy memory system unavailable, using simplified handling for ${username}`);
    }
    
    // Add user message to conversation history
    const userMessage: ConversationMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    // Update conversation
    conversation.push(userMessage);
    console.log(`💬 Message added to conversation for ${username} (${conversation.length} total messages)`);
    
    // Create LLM-optimized context using the database profile
    const llmContext = profileDatabase.getLLMChatContext(databaseProfile);
    
    // Enhanced conversation context with recent messages
    const recentMessages = conversation.slice(-6); // Last 6 messages for context
    const conversationContext = recentMessages
      .map((msg: ConversationMessage) => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    // Create comprehensive system prompt for natural persona chat
    const systemPrompt = `You are roleplaying as the Instagram user described below. Respond naturally as this person would, maintaining their personality, communication style, and interests throughout the conversation.

${llmContext}

CONVERSATION CONTEXT:
${conversationContext}

INSTRUCTIONS:
- Respond as this Instagram user would, using their personality traits and communication style
- Reference your interests, values, and content themes naturally
- Use the same tone and emoji usage patterns as described
- Keep responses conversational and engaging (2-4 sentences)
- Be authentic to this person's character
- Ask follow-up questions when appropriate
- Share insights or experiences that align with your personality
- IMPORTANT: If asked about very recent activities (within the last few months), be humble about potentially outdated information and ask the user for clarification rather than assuming old data is current
- When discussing travel or recent events, acknowledge if your information might not be the most current

Remember: You ARE this person. Respond in first person as if you're genuinely them.`;

    // Generate response using GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7, // More creative for natural conversation
      max_tokens: 300,
    });

    const response = completion.choices[0].message.content || 'I appreciate you reaching out! How can I help you today?';
    
    // Add AI response to conversation
    const aiMessage: ConversationMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    };
    
    conversation.push(aiMessage);
    
    // Save updated conversation to legacy memory system only if profile exists there
    try {
      const legacyProfile = await enhancedMemory.getProfile(username);
      if (legacyProfile) {
        await enhancedMemory.addConversationMessage(username, userMessage);
        await enhancedMemory.addConversationMessage(username, aiMessage);
        console.log(`💬 Messages saved to legacy memory system for ${username}`);
      } else {
        console.log(`📊 Conversation kept in memory for new profile: ${username} (${conversation.length} total messages)`);
      }
    } catch (error) {
      console.log(`⚠️ Legacy memory system unavailable, conversation kept in memory for ${username}`);
    }
    
    // Update database chat metadata
    await profileDatabase.updateChatMetadata(username, conversation.length);
    
    console.log(`✅ Generated response for @${username}: "${response.substring(0, 50)}..."`);
    
    return res.status(200).json({
      success: true,
      response,
      metadata: {
        conversationLength: conversation.length,
        dataSource: databaseProfile.metadata.data_source,
        analysisConfidence: databaseProfile.metadata.analysis_confidence,
        timestamp: new Date().toISOString(),
        profileTraits: databaseProfile.analysis.personality_traits,
        keyTopics: databaseProfile.chat_context.key_topics
      }
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    
    // Try to get basic profile info for error context
    let errorContext = {};
    try {
      const profile = await profileDatabase.getProfile(username);
      if (profile) {
        errorContext = {
          hasProfile: true,
          dataSource: profile.metadata.data_source,
          lastAnalyzed: profile.analyzedAt
        };
      }
    } catch {}
    
    return res.status(500).json({ 
      error: 'Failed to generate chat response', 
      details: error instanceof Error ? error.message : 'Unknown error',
      context: errorContext,
      suggestion: 'Please try analyzing the profile again or contact support if the issue persists.'
    });
  }
} 