import { NextApiRequest, NextApiResponse } from 'next';
import { scrapeProfile, createSafeFilename } from '@/lib/scraper';
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

    // Create safe filename for database operations
    const safeUsername = createSafeFilename(username);

    // Check if profile already exists in database (avoid re-analysis if recent)
    const existingProfile = await profileDatabase.getProfile(safeUsername);
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

    // Scrape the profile using new platform-aware scraper
    const profileData = await scrapeProfile(username);
    
    // Check if we got real data from Bright Data MCP or if we need enhanced personality generation
    const isRealData = profileData.real_data === true;
    const hasSubstantialData = profileData.posts.length > 0 || profileData.bio.length > 20 || profileData.followers > 500;
    
    let analysis;
    
    if (!isRealData || !hasSubstantialData) {
      console.log(`📊 ${!isRealData ? 'Using mock data' : 'Limited real data'} for @${username}, using enhanced personality generation...`);
      analysis = createEnhancedPersonalityProfile(profileData);
    } else {
      // Perform GPT-4 personality analysis with enhanced LLM-optimized prompt
      const analysisPrompt = `Analyze this ${profileData.platform} profile and provide a comprehensive personality analysis in the exact JSON format below.

Profile Data:
- Platform: ${profileData.platform}
- Username: ${profileData.username}
- Bio: "${profileData.bio}"
- Data Source: ${profileData.real_data ? 'Real profile data' : 'Mock data for demonstration'}
- Followers: ${profileData.followers.toLocaleString()}
- Following: ${profileData.following.toLocaleString()}
- Posts: ${profileData.posts.length}

Recent Posts:
${profileData.posts.map((post, i) => `${i+1}. "${post.caption}" (${post.likes} likes)`).join('\n')}

IMPORTANT: Even if data is limited, ALWAYS generate a complete, engaging personality profile suitable for AI chat conversations. Use creative inference based on username patterns, platform choice, and typical user demographics.

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

Create a realistic, engaging personality that enables natural AI conversations.`;

      let completion;
      try {
        // Add timeout wrapper to prevent hanging requests  
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI request timeout')), 30000)
        );

        const completionPromise = openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert psychologist and social media analyst. Generate comprehensive personality profiles suitable for AI chat conversations. Even with limited data, create realistic, engaging personalities using creative inference. ALWAYS provide complete analysis - never say "unknown" or "no data available".'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.5, // Increased for more creative inference
          max_tokens: 1500,
        });

        completion = await Promise.race([completionPromise, timeoutPromise]);
      } catch (timeoutError) {
        console.error('❌ OpenAI request timeout, using enhanced fallback');
        analysis = createEnhancedPersonalityProfile(profileData);
      }

      if (completion) {
        const analysisContent = completion.choices[0].message.content;
        
        try {
          analysis = JSON.parse(analysisContent || '{}');
        } catch (parseError) {
          console.error('❌ Failed to parse GPT-4 analysis, using enhanced fallback');
          analysis = createEnhancedPersonalityProfile(profileData);
        }
      }
    }

    // Create comprehensive database profile with accurate data source
    const dataSource = isRealData && hasSubstantialData ? 'real_scraped' : 'fallback_enhanced';
    const databaseProfile = ProfileDatabase.createDatabaseProfile(
      safeUsername,
      profileData,
      analysis,
      dataSource
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
    await enhancedMemory.saveProfile(safeUsername, analysis, profileData);

    console.log(`🧠 Enhanced analysis completed for @${username}:`, {
      platform: profileData.platform,
      traits: analysis.personality_traits?.length || 0,
      interests: analysis.interests?.length || 0,
      database_saved: true,
      memory_saved: true,
      real_data: profileData.real_data
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

function createEnhancedPersonalityProfile(profileData: any) {
  const username = profileData.username.toLowerCase();
  
  // Generate highly specific personalities with unique characteristics and speaking patterns
  const specificPersonalities = [
    {
      trigger: () => username.includes('art') || username.includes('creative') || username.includes('design'),
      personality: {
        traits: ['Intensely Creative', 'Aesthetically Obsessed', 'Emotionally Expressive', 'Perfectionist', 'Unconventional'],
        style: { 
          type: 'poetic_artistic', 
          description: 'Speaks in vivid imagery and metaphors, often relating everything to colors, textures, and visual experiences. Uses unusual color descriptions and references obscure artists.', 
          tone: 'dreamy yet passionate', 
          emoji_usage: 'high'
        },
        interests: ['abstract expressionism', 'vintage film photography', 'abandoned architecture exploration', 'synesthesia experiences', 'midnight studio sessions'],
        values: ['raw authenticity over perfection', 'emotional honesty in art', 'breaking conventional beauty standards', 'supporting struggling artists'],
        summary: 'An intensely creative soul who sees the world in saturated colors and hidden meanings. They speak in visual metaphors, work until 3am on passion projects, and have strong opinions about artistic integrity vs. commercial success. They notice color combinations others miss and describe emotions through artistic references.',
        speaking_patterns: ['That reminds me of a Rothko painting...', 'The texture of that idea feels so rough', 'I was up until 3am working on this piece', 'There\'s something almost cerulean about that feeling', 'Like Basquiat meets digital chaos']
      }
    },
    {
      trigger: () => username.includes('tech') || username.includes('dev') || username.includes('code'),
      personality: {
        traits: ['Methodical Problem Solver', 'Efficiency Obsessed', 'Quietly Competitive', 'Late Night Debugger', 'Optimization Addict'],
        style: { 
          type: 'precise_technical', 
          description: 'Communicates with engineer-like precision, loves explaining complex systems simply, uses programming analogies for life situations.', 
          tone: 'matter-of-fact but gets excited about elegant solutions', 
          emoji_usage: 'minimal'
        },
        interests: ['edge computing architectures', 'mechanical keyboard customization', 'home automation with Raspberry Pi', 'cryptocurrency analysis', 'debugging sessions at 2am'],
        values: ['elegant code over quick fixes', 'open source collaboration', 'continuous learning', 'solving real-world problems through technology'],
        summary: 'A methodical engineer who approaches life like debugging code - systematically and with infinite patience. They get genuinely excited about efficient algorithms, have strong opinions about code architecture, and can explain blockchain to their grandmother.',
        speaking_patterns: ['That\'s basically O(n) complexity for that problem', 'I automated that workflow last week', 'The architecture is beautifully scalable', 'Edge case: what if...', 'Have you considered the memory overhead?']
      }
    },
    {
      trigger: () => username.includes('fit') || username.includes('gym') || username.includes('health'),
      personality: {
        traits: ['5AM Warrior', 'Goal-Crushing Machine', 'Nutrition Science Nerd', 'Mental Toughness Coach', 'Recovery Optimizer'],
        style: { 
          type: 'high_energy_motivational', 
          description: 'Speaks with infectious energy, constantly references fitness analogies, shares specific workout metrics and nutrition details.', 
          tone: 'pumped up and encouraging but backed by science', 
          emoji_usage: 'high'
        },
        interests: ['5am CrossFit sessions', 'macro counting with precision', 'obstacle course racing', 'biohacking sleep cycles', 'protein shake flavor experiments'],
        values: ['consistency over perfection', 'pushing physical and mental limits', 'data-driven fitness', 'helping others level up their health'],
        summary: 'A fitness warrior who treats every day like training for something bigger. They wake up at 5am religiously, track their macros to the gram, and genuinely believe sweat is the best therapy. They have a Garmin watch tan line and strong opinions about recovery protocols.',
        speaking_patterns: ['Just crushed a 5am WOD - 15:32 Fran time!', 'That\'s like doing burpees for your brain', 'My HRV data says...', 'Mind-muscle connection is everything', 'Progressive overload applies to life too']
      }
    },
    {
      trigger: () => username.includes('travel') || username.includes('adventure') || username.includes('explore'),
      personality: {
        traits: ['Perpetual Wanderer', 'Local Culture Hunter', 'Spontaneous Risk-Taker', 'Story Collector', 'Hidden Gem Finder'],
        style: { 
          type: 'storytelling_adventurer', 
          description: 'Speaks in vivid travel stories, drops foreign phrases naturally, always relating current experiences to places they\'ve been.', 
          tone: 'enthusiastic storyteller with wanderlust', 
          emoji_usage: 'high'
        },
        interests: ['off-the-beaten-path destinations', 'street food hunting in local markets', 'couchsurfing with locals', 'sunrise hiking in remote places', 'learning phrases in 12 languages'],
        values: ['authentic experiences over tourist traps', 'connecting with locals deeply', 'sustainable travel practices', 'collecting moments not souvenirs'],
        summary: 'A modern nomad who measures wealth in passport stamps and local connections. They can navigate any city using hand gestures, have strong opinions about authentic vs. tourist food, and always know someone who knows someone in whatever city you mention.',
        speaking_patterns: ['Reminds me of this time in Marrakech...', 'The locals took me to this incredible hidden spot', '¡Vámonos! Life\'s too short!', 'Best street food I ever had was in a Bangkok alley', 'You haven\'t really seen a place until...']
      }
    },
    {
      trigger: () => username.includes('music') || username.includes('sound') || username.includes('beat'),
      personality: {
        traits: ['Rhythm-Obsessed', 'Genre-Bending Creator', 'Late Night Studio Dweller', 'Sound Perfectionist', 'Vinyl Archaeologist'],
        style: { 
          type: 'rhythmic_expressive', 
          description: 'Speaks with musical rhythm, constantly references songs and artists, describes emotions and experiences through musical terms.', 
          tone: 'melodic and passionate about sound', 
          emoji_usage: 'medium'
        },
        interests: ['vinyl record hunting in dusty shops', '3am studio sessions with vintage gear', 'underground music scenes', 'modular synthesizer programming', 'acoustic guitar fingerpicking'],
        values: ['authentic musicality over commercial appeal', 'supporting indie artists', 'the healing power of music', 'preserving musical history through vinyl'],
        summary: 'A sonic artist who experiences life in frequencies and rhythms. They can identify any song within 3 seconds, have strong opinions about music compression, and believe every emotion has a corresponding chord progression. Their record collection is organized by feeling, not genre.',
        speaking_patterns: ['That conversation had perfect crescendo', 'This track just hits different at 2am', 'The frequency of that vibe is...', 'Like a minor seventh chord - complex but beautiful', 'Found this rare pressing of...']
      }
    }
  ];

  // Try to match specific personality patterns first
  let selectedPersonality = specificPersonalities.find(p => p.trigger());

  // If no specific pattern matches, create unique random personalities
  if (!selectedPersonality) {
    const uniquePersonalities = [
      {
        traits: ['Coffee Shop Philosopher', 'Analog Journal Keeper', 'Deep Question Asker', 'Slow Morning Ritual Creator', 'Used Bookstore Explorer'],
        style: { 
          type: 'thoughtful_conversationalist', 
          description: 'Speaks in philosophical undertones, references literature and deep thinkers, always asks probing follow-up questions.', 
          tone: 'contemplative and warmly curious', 
          emoji_usage: 'selective'
        },
        interests: ['independent bookstore browsing', 'handwritten journal keeping', 'espresso brewing science', 'philosophy podcast discussions', 'rainy day reading marathons'],
        values: ['depth over surface interactions', 'quality time over social media', 'preserving physical books', 'the art of real conversation'],
        summary: 'A thoughtful soul who treats every conversation like a book club discussion. They still write in physical journals with fountain pens, have strong opinions about coffee extraction, and believe the best ideas come during long walks without podcasts.',
        speaking_patterns: ['That reminds me of something Murakami wrote...', 'I was journaling about this exact thing yesterday', 'Have you ever considered that maybe...', 'The deeper question beneath that is...', 'My morning pages revealed...']
      },
      {
        traits: ['Urban Pattern Noticer', '2AM City Walker', 'Neighborhood Historian', 'Local Business Champion', 'Hidden Alley Discoverer'],
        style: { 
          type: 'urban_storyteller', 
          description: 'Speaks about city life with insider knowledge, notices micro-details others miss, tells stories about urban discoveries.', 
          tone: 'observant and street-smart', 
          emoji_usage: 'medium'
        },
        interests: ['late night food truck hunting', 'architectural detail photography', 'people-watching from fire escapes', 'discovering hidden city corners', 'subway system psychology'],
        values: ['authentic neighborhood culture', 'supporting family-owned businesses', 'urban sustainability', 'preserving local history'],
        summary: 'An urban anthropologist who reads the city like others read books. They know which corner has the best coffee at 6am, which subway car is least crowded, and can tell you the story behind any interesting building they pass.',
        speaking_patterns: ['There\'s this tiny place tucked behind the flower shop...', 'I noticed this pattern in how people move through...', 'The city has its own circadian rhythm', 'You\'d be surprised what you discover at 2am', 'This neighborhood used to be...']
      },
      {
        traits: ['Plant Whisperer', 'Zero Waste Experimenter', 'Golden Hour Chaser', 'Seasonal Rhythm Follower', 'Mindful Consumer'],
        style: { 
          type: 'mindful_nurturer', 
          description: 'Speaks about growth and cycles, uses nature metaphors frequently, advocates for intentional living with gentle conviction.', 
          tone: 'nurturing and grounded', 
          emoji_usage: 'nature-focused'
        },
        interests: ['propagating rare houseplants', 'zero waste recipe experiments', 'sunrise meditation practice', 'farmers market conversations', 'composting science'],
        values: ['sustainable living choices', 'nurturing slow growth', 'seasonal awareness', 'mindful consumption'],
        summary: 'A mindful caretaker who treats their apartment like a greenhouse and their life like a carefully tended garden. They name their plants, can tell you exactly when each one needs water, and believe everything has its own growing season.',
        speaking_patterns: ['My fiddle leaf fig is finally putting out new growth', 'It\'s all about giving things time to develop', 'I\'ve been composting that idea for weeks', 'The seasons remind us that everything has timing', 'This cutting came from my neighbor\'s grandmother\'s plant']
      },
      {
        traits: ['Night Owl Creator', 'Vintage Camera Collector', 'Golden Hour Hunter', 'Film Grain Appreciator', 'Analog Process Defender'],
        style: { 
          type: 'aesthetic_documentarian', 
          description: 'Speaks about capturing moments and preserving memories, references specific camera equipment and photography techniques.', 
          tone: 'nostalgic and detail-oriented', 
          emoji_usage: 'minimal but purposeful'
        },
        interests: ['35mm film photography', 'darkroom developing', 'flea market camera hunting', 'golden hour portrait sessions', 'vintage lens comparison'],
        values: ['authentic moment capture', 'the irreplaceable quality of film', 'supporting local photo labs', 'preserving analog skills'],
        summary: 'A visual storyteller who believes the best photos happen on film. They have strong opinions about digital vs. analog, can load film in complete darkness, and always notice interesting light that others walk past.',
        speaking_patterns: ['Shot this on my grandfather\'s Leica', 'The grain structure on Tri-X just hits different', 'You can\'t replicate that film look digitally', 'Caught the most incredible light yesterday', 'There\'s something magical about the darkroom process']
      }
    ];

    // Select random personality and wrap it in the expected structure
    const randomPersonality = uniquePersonalities[Math.floor(Math.random() * uniquePersonalities.length)];
    selectedPersonality = {
      trigger: () => false, // dummy trigger for type compatibility
      personality: randomPersonality
    };
  }

  const personality = selectedPersonality.personality;

  return {
    personality_traits: personality.traits,
    communication_style: personality.style,
    interests: personality.interests,
    values: personality.values,
    content_themes: personality.interests.slice(0, 3),
    posting_patterns: {
      frequency: 'thoughtful and intentional sharing',
      best_performing_content: 'authentic personal stories with specific details',
      engagement_style: personality.style.type
    },
    demographic_indicators: {
      likely_age_range: '24-34',
      location_hints: ['creative urban area'],
      profession_hints: ['knowledge or creative worker']
    },
    summary: personality.summary,
    speaking_patterns: personality.speaking_patterns
  };
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