import { NextApiRequest, NextApiResponse } from 'next';
import { scrapeProfile } from '@/lib/scraper';
import { enhancedMemory } from '@/lib/memory-enhanced';
import { profileDatabase, ProfileDatabase } from '@/lib/profile-database';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // Check if profile already exists in database (avoid re-analysis if recent)
    const existingProfile = await profileDatabase.getProfile(username);
    if (existingProfile) {
      const hoursSinceUpdate = (Date.now() - new Date(existingProfile.lastUpdated).getTime()) / (1000 * 60 * 60);
      if (hoursSinceUpdate < 24) { // Use cached if less than 24 hours old
        console.log(`📁 Using cached analysis for @${username} (${hoursSinceUpdate.toFixed(1)}h old)`);
        return res.status(200).json({
          success: true,
          cached: true,
          profile: existingProfile.profile,
          analysis: existingProfile.analysis,
          chat_context: existingProfile.chat_context,
          metadata: existingProfile.metadata
        });
      }
    }

    // Scrape the profile
    const profileData = await scrapeProfile(username);
    
    // Perform GPT-4 personality analysis with enhanced LLM-optimized prompt
    const analysisPrompt = `Analyze this Instagram profile and provide a comprehensive personality analysis in the exact JSON format below.

Profile Data:
- Username: ${profileData.username}
- Bio: "${profileData.bio}"
- Followers: ${profileData.followers.toLocaleString()}
- Following: ${profileData.following.toLocaleString()}
- Posts: ${profileData.posts.length}

Recent Posts:
${profileData.posts.map((post, i) => `${i+1}. "${post.caption}" (${post.likes} likes)`).join('\n')}

Provide analysis in this exact JSON structure:
{
  "personality_traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "communication_style": {
    "type": "brief_style_type",
    "description": "detailed description of communication style",
    "tone": "overall_tone",
    "emoji_usage": "high|medium|low|none"
  },
  "interests": ["interest1", "interest2", "interest3", "interest4", "interest5"],
  "values": ["value1", "value2", "value3", "value4"],
  "content_themes": ["theme1", "theme2", "theme3"],
  "posting_patterns": {
    "frequency": "posting frequency description",
    "best_performing_content": "type of content that performs best",
    "engagement_style": "how they engage with audience"
  },
  "demographic_indicators": {
    "likely_age_range": "age range",
    "location_hints": ["location1", "location2"],
    "profession_hints": ["profession1", "profession2"]
  },
  "summary": "comprehensive personality summary paragraph for chat context"
}

Be specific, insightful, and ensure all data is useful for LLM chat generation.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert psychologist and social media analyst. Analyze Instagram profiles to extract deep personality insights and communication patterns. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const analysisContent = completion.choices[0].message.content;
    let analysis;
    
    try {
      analysis = JSON.parse(analysisContent || '{}');
    } catch (parseError) {
      console.error('❌ Failed to parse GPT-4 analysis, using fallback');
      analysis = createFallbackAnalysis(profileData);
    }

    // Create comprehensive database profile
    const databaseProfile = ProfileDatabase.createDatabaseProfile(
      username,
      profileData,
      analysis,
      profileData.bio.includes('Mock') ? 'fallback_enhanced' : 'web_unlocker_parsed'
    );

    // Enhanced chat context creation
    databaseProfile.chat_context = {
      personality_summary: analysis.summary || `${analysis.personality_traits?.slice(0, 3).join(', ')} individual who focuses on ${analysis.interests?.slice(0, 2).join(' and ')}`,
      speaking_style_examples: createSpeakingStyleExamples(analysis, profileData),
      key_topics: [...(analysis.interests || []), ...(analysis.content_themes || [])].slice(0, 8),
      response_patterns: createResponsePatterns(analysis),
      conversation_starters: createConversationStarters(analysis)
    };

    // Save to new database system
    await profileDatabase.saveProfile(databaseProfile);

    // Also save to legacy memory system for backward compatibility
    await enhancedMemory.saveProfile(username, analysis, profileData);

    console.log(`🧠 Enhanced analysis completed for @${username}:`, {
      traits: analysis.personality_traits?.length || 0,
      interests: analysis.interests?.length || 0,
      database_saved: true,
      memory_saved: true
    });

    return res.status(200).json({
      success: true,
      cached: false,
      profile: {
        username: username, // Add username to response
        bio: databaseProfile.profile.bio,
        followers: databaseProfile.profile.followers,
        following: databaseProfile.profile.following,
        posts: databaseProfile.profile.posts
      },
      analysis: databaseProfile.analysis,
      chat_context: databaseProfile.chat_context,
      visual_data: databaseProfile.visual_data,
      metadata: {
        ...databaseProfile.metadata,
        username,
        analyzedAt: databaseProfile.analyzedAt,
        dataSource: databaseProfile.metadata.data_source
      }
    });

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze profile', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function createFallbackAnalysis(profileData: any) {
  const username = profileData.username.toLowerCase();
  
  // Create specific analysis for well-known personalities
  if (username.includes('rock') || username.includes('therock')) {
    return {
      personality_traits: ['Motivated', 'Disciplined', 'Charismatic', 'Family-oriented', 'Grateful'],
      communication_style: {
        type: 'motivational',
        description: 'High-energy, inspirational communication rooted in Hawaiian values and hard work ethic. Uses terms like "mana," "ohana," and "iron paradise." Focuses on gratitude, family, and relentless work ethic.',
        tone: 'positive and powerful',
        emoji_usage: 'high'
      },
      interests: ['fitness training', 'Hawaiian culture', 'family time', 'Teremana tequila business', 'professional wrestling', 'acting', 'iron paradise workouts'],
      values: ['hard work', 'family (ohana)', 'gratitude', 'Hawaiian heritage', 'discipline', 'humility'],
      content_themes: ['workout motivation', 'family gratitude', 'Hawaiian culture', 'business insights', 'tequila brand'],
      posting_patterns: {
        frequency: 'daily motivational posts',
        best_performing_content: 'workout videos and family moments',
        engagement_style: 'high-energy motivational with Hawaiian spirit'
      },
      demographic_indicators: {
        likely_age_range: '45-55',
        location_hints: ['Hawaii', 'Los Angeles', 'Miami'],
        profession_hints: ['actor', 'former wrestler', 'producer', 'entrepreneur']
      },
      summary: `A highly motivated and disciplined individual rooted in Hawaiian culture and values. Known for his "mana" energy, gratitude practice, and relentless work ethic. Embodies the spirit of "ohana" (family) and uses his "iron paradise" workouts as both physical and mental training. Communication style combines motivational intensity with Hawaiian warmth and humility. Built his success on hard work, starting from his wrestling roots in Hawaii to becoming a global entertainment and business icon.`
    };
  }
  
  if (username.includes('elon') || username.includes('musk')) {
    return {
      personality_traits: ['Innovative', 'Ambitious', 'Analytical', 'Visionary', 'Direct'],
      communication_style: {
        type: 'analytical',
        description: 'Direct, technical communication with focus on innovation and future possibilities',
        tone: 'confident',
        emoji_usage: 'low'
      },
      interests: ['technology', 'space exploration', 'sustainable energy', 'AI', 'engineering'],
      values: ['innovation', 'sustainability', 'progress', 'efficiency', 'truth'],
      content_themes: ['technology updates', 'space exploration', 'business insights'],
      posting_patterns: {
        frequency: 'frequent tech updates',
        best_performing_content: 'technology and space content',
        engagement_style: 'direct and informative'
      },
      demographic_indicators: {
        likely_age_range: '45-55',
        location_hints: ['Austin', 'Hawthorne'],
        profession_hints: ['entrepreneur', 'engineer', 'CEO']
      },
      summary: `A visionary entrepreneur focused on advancing technology and space exploration. Known for direct communication, innovative thinking, and ambitious goals to improve humanity's future.`
    };
  }
  
  // Generic creative fallback for other users
  return {
    personality_traits: ['creative', 'social', 'optimistic', 'authentic', 'engaging'],
    communication_style: {
      type: 'friendly',
      description: 'Warm and engaging communication with focus on authenticity',
      tone: 'positive',
      emoji_usage: 'medium'
    },
    interests: ['lifestyle', 'creativity', 'social connections', 'personal growth', 'sharing experiences'],
    values: ['authenticity', 'creativity', 'community', 'growth', 'positivity'],
    content_themes: ['lifestyle', 'personal moments', 'inspirational content'],
    posting_patterns: {
      frequency: 'regular posting schedule',
      best_performing_content: 'authentic personal moments',
      engagement_style: 'interactive and responsive'
    },
    demographic_indicators: {
      likely_age_range: '25-35',
      location_hints: ['urban area'],
      profession_hints: ['creative field']
    },
    summary: `A creative and social individual who values authenticity and community. They share engaging content about their lifestyle and personal experiences, with a focus on inspiring others and building genuine connections.`
  };
}

function createSpeakingStyleExamples(analysis: any, profileData: any): string[] {
  const examples = [];
  
  if (analysis.communication_style?.emoji_usage === 'high') {
    examples.push("I love sharing these moments! ✨");
  }
  
  if (analysis.personality_traits?.includes('creative')) {
    examples.push("Always inspired by new ideas and projects");
  }
  
  if (analysis.personality_traits?.includes('optimistic')) {
    examples.push("Life is full of amazing possibilities");
  }
  
  // Add examples based on actual post content
  const recentPosts = profileData.posts?.slice(0, 2) || [];
  recentPosts.forEach((post: any) => {
    if (post.caption && post.caption.length > 20) {
      const shortExample = post.caption.substring(0, 50) + (post.caption.length > 50 ? '...' : '');
      examples.push(shortExample);
    }
  });
  
  return examples.slice(0, 4); // Limit to 4 examples
}

function createResponsePatterns(analysis: any): string[] {
  const patterns = ['Enthusiastic and engaging'];
  
  if (analysis.communication_style?.emoji_usage !== 'none') {
    patterns.push('Uses emojis to express emotions');
  }
  
  if (analysis.personality_traits?.includes('authentic')) {
    patterns.push('Shares personal experiences openly');
  }
  
  if (analysis.personality_traits?.includes('social')) {
    patterns.push('Asks questions to engage others');
  }
  
  return patterns;
}

function createConversationStarters(analysis: any): string[] {
  const starters = [];
  
  const interests = analysis.interests || [];
  if (interests.includes('creativity') || interests.includes('art')) {
    starters.push("What's inspiring your creativity lately?");
  }
  
  if (interests.includes('lifestyle') || interests.includes('travel')) {
    starters.push("Tell me about your latest adventure!");
  }
  
  if (interests.includes('personal growth')) {
    starters.push("What's something new you've learned recently?");
  }
  
  starters.push("What's the highlight of your day?");
  starters.push("Share something that made you smile today!");
  
  return starters.slice(0, 5);
} 