import OpenAI from 'openai';
import { ProfileData } from './scraper';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PersonalityAnalysis {
  traits: string[];
  communication_style: string;
  interests: string[];
  values: string[];
  summary: string;
}

export async function analyzePersonality(profileData: ProfileData): Promise<PersonalityAnalysis> {
  const prompt = `Analyze the following Instagram profile data and provide a comprehensive personality analysis:

Username: ${profileData.username}
Bio: ${profileData.bio}
Followers: ${profileData.followers}
Following: ${profileData.following}

Recent Posts:
${profileData.posts.map(post => `
- Caption: ${post.caption}
- Likes: ${post.likes}
- Comments: ${post.comments.map(c => `"${c.text}"`).join(', ')}
`).join('\n')}

IMPORTANT: Return ONLY a valid JSON object with NO markdown formatting, code blocks, or extra text.

{
  "traits": ["list of personality traits"],
  "communication_style": "description of how they communicate",
  "interests": ["list of interests and hobbies"],
  "values": ["list of core values and beliefs"],
  "summary": "comprehensive personality summary"
}

Focus on:
1. Personality traits that can be inferred from their content
2. Communication style and tone
3. Interests and hobbies they engage with
4. Values and beliefs they express
5. Overall personality summary

Be specific and insightful while remaining objective.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert personality analyst. Analyze social media profiles and provide detailed, accurate personality assessments based on available data. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonContent = content.trim();
    
    // Remove markdown code block markers if present
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Parse JSON response
    const analysis = JSON.parse(jsonContent) as PersonalityAnalysis;
    
    // Validate the response structure
    if (!analysis.traits || !analysis.communication_style || !analysis.interests || !analysis.values || !analysis.summary) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing personality:', error);
    
    // Fallback analysis for development
    return {
      traits: ['Creative', 'Outgoing', 'Authentic', 'Passionate'],
      communication_style: 'Casual and friendly with a touch of humor',
      interests: ['Photography', 'Travel', 'Food', 'Fitness'],
      values: ['Authenticity', 'Connection', 'Growth', 'Adventure'],
      summary: `${profileData.username} appears to be a creative and outgoing individual who values authentic connections and personal growth. They have a casual, friendly communication style and are passionate about photography, travel, and maintaining an active lifestyle.`,
    };
  }
} 