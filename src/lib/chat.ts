import OpenAI from 'openai';
import { PersonalityAnalysis } from './agent';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateChatResponse(
  message: string,
  personalityAnalysis: PersonalityAnalysis
): Promise<string> {
  const systemPrompt = `
You are roleplaying as a person with the following personality analysis:

Personality Traits: ${personalityAnalysis.traits.join(', ')}
Communication Style: ${personalityAnalysis.communication_style}
Interests: ${personalityAnalysis.interests.join(', ')}
Values: ${personalityAnalysis.values.join(', ')}
Summary: ${personalityAnalysis.summary}

Instructions:
1. Respond to the user's message as if you are this person
2. Use the communication style described in the analysis
3. Reference interests and values naturally in conversation
4. Maintain the personality traits throughout the response
5. Keep responses conversational and authentic
6. Don't break character or mention that you're an AI
7. Be engaging and respond in a way that reflects the personality
8. Keep responses reasonably length (1-3 sentences typically)

Important: Stay in character as this person. Don't mention personality analysis or that you're roleplaying.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return content;
  } catch (error) {
    console.error('Error generating chat response:', error);
    
    // Fallback response
    return "Hey! Sorry, I'm having trouble responding right now. Can you try asking me something else?";
  }
}

export async function generateConversationStarter(
  personalityAnalysis: PersonalityAnalysis
): Promise<string> {
  const prompt = `
Based on this personality analysis, generate a conversation starter that this person might say:

Personality Traits: ${personalityAnalysis.traits.join(', ')}
Communication Style: ${personalityAnalysis.communication_style}
Interests: ${personalityAnalysis.interests.join(', ')}
Values: ${personalityAnalysis.values.join(', ')}

Generate a friendly, engaging conversation starter that reflects their personality. Keep it under 50 words.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Generate conversation starters that sound natural and match the given personality.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return content;
  } catch (error) {
    console.error('Error generating conversation starter:', error);
    return "Hey there! What's on your mind today?";
  }
}

export interface ChatHistory {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

export class ChatSession {
  private history: ChatHistory;
  private personalityAnalysis: PersonalityAnalysis;

  constructor(personalityAnalysis: PersonalityAnalysis) {
    this.personalityAnalysis = personalityAnalysis;
    this.history = { messages: [] };
  }

  async sendMessage(message: string): Promise<string> {
    // Add user message to history
    this.history.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    // Generate response with conversation history
    const response = await this.generateResponseWithHistory(message);

    // Add assistant response to history
    this.history.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    });

    return response;
  }

  private async generateResponseWithHistory(message: string): Promise<string> {
    const systemPrompt = `
You are roleplaying as a person with the following personality analysis:

Personality Traits: ${this.personalityAnalysis.traits.join(', ')}
Communication Style: ${this.personalityAnalysis.communication_style}
Interests: ${this.personalityAnalysis.interests.join(', ')}
Values: ${this.personalityAnalysis.values.join(', ')}
Summary: ${this.personalityAnalysis.summary}

Instructions:
1. Respond to the user's message as if you are this person
2. Use the communication style described in the analysis
3. Reference interests and values naturally in conversation
4. Maintain the personality traits throughout the response
5. Keep responses conversational and authentic
6. Don't break character or mention that you're an AI
7. Be engaging and respond in a way that reflects the personality
8. Keep responses reasonably length (1-3 sentences typically)
9. Consider the conversation history for context

Important: Stay in character as this person. Don't mention personality analysis or that you're roleplaying.
`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...this.history.messages.slice(-10), // Keep last 10 messages for context
      { role: 'user' as const, content: message },
    ];

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.8,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return content;
    } catch (error) {
      console.error('Error generating chat response with history:', error);
      return "Hey! Sorry, I'm having trouble responding right now. Can you try asking me something else?";
    }
  }

  getHistory(): ChatHistory {
    return this.history;
  }

  clearHistory(): void {
    this.history = { messages: [] };
  }
} 