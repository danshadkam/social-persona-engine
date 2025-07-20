# Social Persona Engine

A Next.js application that analyzes Instagram profiles to understand personality traits and enables chat conversations with AI personas that mimic the analyzed user's communication style.

## 🌟 Recent Updates (December 2024)

### ✅ **Fully Functional System**
- **Enhanced Memory System**: File-based persistence survives development hot reloads
- **Smart Fallback**: Automatically detects empty API responses and uses rich mock data
- **Robust Error Handling**: Graceful degradation with user-friendly error messages
- **Chat System**: Fully working AI persona conversations with contextual memory
- **Production Ready**: Comprehensive logging, debugging, and monitoring capabilities

### 🔧 **Major Improvements**
- **Memory Persistence**: Profiles survive server restarts during development
- **MCP Integration**: Enhanced Bright Data integration with better error handling
- **Empty Data Detection**: Smart detection of empty API responses with automatic fallback
- **JSON Parsing**: Robust handling of GPT responses with markdown code block stripping
- **Development Experience**: Hot reload support with persistent data storage

## Features

- 🔍 **Instagram Profile Analysis**: Scrapes and analyzes Instagram profiles to extract personality insights
- 🧠 **AI Personality Analysis**: Uses GPT-4 to analyze communication patterns, interests, and values
- 💬 **AI Persona Chat**: Chat with an AI that mimics the analyzed user's personality and communication style
- 📊 **Personality Insights**: Displays traits, communication style, interests, and values
- 🎨 **Modern UI**: Clean, responsive interface built with Tailwind CSS and shadcn/ui
- 🧠 **Enhanced Memory System**: Uses embeddings for contextual conversation memory with file persistence
- 🔄 **Smart Fallback**: Automatic detection and fallback for empty API responses
- 🛡️ **Robust Error Handling**: Comprehensive error handling with user-friendly messages

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **AI**: OpenAI GPT-4 with text-embedding-3-small for context memory
- **Web Scraping**: Bright Data MCP (Model Context Protocol) with enhanced error handling
- **Memory System**: Vector embeddings with file-based persistence for development
- **Icons**: Lucide React

## Project Structure

```
/social-persona-engine
│
├── /src
│   ├── /pages
│   │   ├── index.tsx              # Main UI page with enhanced error handling
│   │   ├── api/
│   │   │   ├── analyze.ts         # Profile analysis endpoint
│   │   │   ├── chat.ts            # Enhanced chat response endpoint
│   │   │   ├── mcp-health.ts      # MCP health check endpoint
│   │   │   ├── debug-memory.ts    # Memory debugging endpoint
│   │   │   └── test-config.ts     # Configuration testing endpoint
│   ├── /lib
│   │   ├── mcp-config.ts          # Enhanced Bright Data MCP configuration
│   │   ├── scraper.ts             # Instagram scraping with smart fallback
│   │   ├── agent.ts               # GPT personality analysis with JSON parsing
│   │   ├── memory-enhanced.ts     # Enhanced memory system with file persistence
│   │   └── chat.ts                # Legacy chat logic (deprecated)
│   └── /components/ui/            # shadcn/ui components
│
├── /public                        # Static assets
├── .memory-cache.json             # Development memory persistence (auto-generated)
├── .env.local                     # Environment variables
├── package.json
└── README.md
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key
- Bright Data account and API token (optional - system works with fallback data)

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd social-persona-engine

# Install dependencies (includes Bright Data MCP SDK)
npm install

# Copy environment file
cp .env.local.example .env.local
```

### 3. Dependencies Installed

The following MCP and AI-related dependencies are included:

```json
{
  "@brightdata/mcp": "^2.4.1",
  "@modelcontextprotocol/sdk": "^1.16.0", 
  "mcp-remote": "^0.1.18",
  "openai": "^5.10.1",
  "@types/ws": "^8.5.12",
  "ws": "^8.18.0"
}
```

### 4. Environment Configuration

Edit `.env.local` with your API keys:

```env
# Required: OpenAI API Key for personality analysis and embeddings
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Bright Data API Token for Instagram scraping
# System works with enhanced mock data if not provided
BRIGHT_DATA_API_TOKEN=your_bright_data_api_token_here

# App URL for development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Custom zones (defaults provided)
# BRIGHT_DATA_WEB_UNLOCKER_ZONE=custom_unlocker_zone
# BRIGHT_DATA_BROWSER_ZONE=custom_browser_zone
```

### 5. Bright Data Setup (Optional)

1. **Create Account**: Sign up at [brightdata.com](https://brightdata.com)
2. **Get API Token**: 
   - Go to your Bright Data dashboard → Settings → API Tokens
   - Copy your API token (format: `2dceb1aa0***************************`)
3. **Free Tier**: New accounts get 5,000 requests per month for free
4. **MCP Integration**: The app uses Bright Data's official MCP SDK for reliable scraping

**Note**: The system works perfectly without Bright Data API token using enhanced mock data that provides realistic personality analysis.

### 6. Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The application will be available at `http://localhost:3000`.

## Usage

### 1. Profile Analysis

1. Enter an Instagram username in the input field (try: "nasa", "spacex", "emrata")
2. Click "Analyze" to scrape and analyze the profile
3. View the comprehensive personality analysis including:
   - Personality traits
   - Communication style
   - Interests and hobbies
   - Core values
   - Personality summary

### 2. Enhanced AI Chat

1. After analyzing a profile, switch to the "Chat" tab
2. Type messages to chat with an AI persona that mimics the analyzed user
3. The system uses:
   - **Vector embeddings** for conversation context
   - **Cosine similarity** for relevant message retrieval
   - **Enhanced memory** that learns from each conversation
   - **Smart fallback data** for consistent personality traits

## System Status & Features

### ✅ **Working Features**

- **Profile Analysis**: Fully functional with both real and enhanced mock data
- **AI Personality Analysis**: GPT-4 powered analysis with robust JSON parsing
- **Chat System**: Real-time conversation with AI personas
- **Memory System**: Persistent storage with vector embeddings
- **Error Handling**: Comprehensive error handling with user guidance
- **Development Tools**: Health checks, debugging endpoints, and logging

### 🔄 **Smart Data Handling**

The system intelligently handles different data scenarios:

1. **Real Bright Data**: When API returns valid data
2. **Empty API Response**: Automatically falls back to enhanced mock data
3. **API Errors**: Graceful degradation with meaningful error messages
4. **Development Mode**: File-based persistence survives hot reloads

### 📊 **Data Sources**

- **Primary**: Bright Data MCP for real Instagram data
- **Fallback**: Enhanced mock data with realistic personality traits
- **Persistence**: `.memory-cache.json` for development continuity

## API Endpoints

### POST /api/analyze

Analyzes an Instagram profile and returns personality insights.

**Request Body:**
```json
{
  "username": "instagram_username"
}
```

**Response:**
```json
{
  "traits": ["Creative", "Outgoing", "Authentic"],
  "communication_style": "Casual and friendly with humor",
  "interests": ["Photography", "Travel", "Food"],
  "values": ["Authenticity", "Connection", "Growth"],
  "summary": "Personality summary...",
  "metadata": {
    "username": "instagram_username",
    "followers": 1000000,
    "following": 500,
    "postsAnalyzed": 5,
    "dataSource": "instagram", // or "fallback"
    "timestamp": "2025-01-20T10:00:00.000Z"
  }
}
```

### POST /api/chat

Generates enhanced chat responses using personality analysis and conversation context.

**Request Body:**
```json
{
  "message": "Hello!",
  "username": "instagram_username"
}
```

**Response:**
```json
{
  "response": "Hey there! How's it going? 😊",
  "metadata": {
    "conversationLength": 3,
    "dataSource": "real_instagram_data",
    "timestamp": "2025-01-20T10:00:00.000Z"
  }
}
```

### GET /api/mcp-health

Health check endpoint for Bright Data MCP integration.

**Response:**
```json
{
  "status": "healthy",
  "mcp": {
    "available": true,
    "zones": ["Unlocker(mcp_unlocker)", "Browser(mcp_browser)"]
  },
  "timestamp": "2025-01-20T10:00:00.000Z"
}
```

### GET /api/debug-memory

Debug endpoint to inspect memory storage.

**Response:**
```json
{
  "totalProfiles": 2,
  "profiles": [
    {
      "username": "nasa",
      "lastUpdated": "2025-01-20T10:00:00.000Z",
      "realDataUsed": false,
      "conversationLength": 5
    }
  ]
}
```

## Configuration

### Enhanced Memory System

The application features an advanced memory system with:

**Key Features:**
- **File-Based Persistence**: Survives development server restarts and hot reloads
- **Vector Embeddings**: Uses OpenAI's text-embedding-3-small model
- **Contextual Memory**: Stores conversation history with semantic understanding
- **Similarity Matching**: Retrieves relevant past conversations using cosine similarity
- **Data Source Tracking**: Distinguishes between real Instagram data and fallback data
- **Automatic Cleanup**: Profiles expire after 24 hours

**Development Benefits:**
- No data loss during code changes
- Persistent conversation history
- Fast development iteration
- Automatic cache management

### Web Scraping with Bright Data MCP

**Enhanced Integration:**
- **Smart Fallback**: Automatically detects empty responses and uses realistic mock data
- **Error Handling**: Comprehensive error handling with meaningful user messages
- **Official SDK**: Uses `@brightdata/mcp` v2.4.1 for reliable scraping
- **Multiple Tools**: Instagram Profile Scraper, Web Unlocker, SERP API
- **Development Mode**: Works perfectly without API tokens using enhanced mock data

**Key Benefits:**
- **Bypass Anti-Bot Protection**: Automatically handles CAPTCHAs and bot detection
- **Global Proxy Network**: Access content from 195+ countries
- **High Reliability**: Enterprise-grade infrastructure with 99.9% uptime
- **AI-Ready Data**: Clean, structured output optimized for LLM processing
- **Free Tier**: 5,000 requests per month at no cost
- **TypeScript Support**: Full type safety with official SDK

### Memory Storage

**Current Implementation:**
- In-memory storage with Map for runtime performance
- File-based persistence (`.memory-cache.json`) for development continuity
- Enhanced profiles with embeddings and conversation history
- Automatic expiration (24 hours)
- Smart cache loading and saving

**Production Recommendations:**
- **Vector Database**: Pinecone, Weaviate, or Chroma for embeddings
- **Session Storage**: Redis for fast conversation retrieval
- **Persistent Storage**: PostgreSQL for user profiles and long-term data

## Error Handling & Debugging

### Comprehensive Error Handling

The system includes robust error handling for:

- **API Failures**: Graceful degradation to fallback data
- **JSON Parsing**: Strips markdown code blocks from GPT responses
- **Empty Responses**: Smart detection and automatic fallback
- **Network Issues**: Retry logic with exponential backoff
- **User Guidance**: Clear error messages with suggested actions

### Development Tools

- **Health Check**: `/api/mcp-health` for system status monitoring
- **Memory Debug**: `/api/debug-memory` for inspecting stored profiles
- **Config Test**: `/api/test-config` for validating environment setup
- **Console Logging**: Comprehensive logging throughout the application

## Development

### Adding New Features

1. **API Endpoints**: Add new endpoints in `/src/pages/api/`
2. **UI Components**: Create components in `/src/components/`
3. **Utility Functions**: Add utilities in `/src/lib/`
4. **MCP Integration**: Extend `/src/lib/mcp-config.ts` for new Bright Data tools

### Customizing Analysis

Modify the personality analysis in `src/lib/agent.ts`:
- Add new personality dimensions
- Change analysis criteria
- Adjust response format
- Integrate additional data sources

### Testing

```bash
# Test profile analysis
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"username":"nasa"}'

# Test chat functionality
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!","username":"nasa"}'

# Check system health
curl http://localhost:3000/api/mcp-health

# Debug memory storage
curl http://localhost:3000/api/debug-memory
```

### Styling

The application uses Tailwind CSS with shadcn/ui components:
- Colors and themes in `tailwind.config.js`
- Component variants in `/src/components/ui/`
- Global styles in `/src/app/globals.css`

## Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
npm install -g vercel
vercel

# Set environment variables in Vercel dashboard
```

**Required Environment Variables for Production:**
- `OPENAI_API_KEY` (Required)
- `BRIGHT_DATA_API_TOKEN` (Optional - system works with fallback data)
- `NEXT_PUBLIC_APP_URL`

### Other Platforms

The application can be deployed on:
- Netlify
- Railway
- Heroku
- AWS/GCP/Azure

Ensure environment variables are properly configured on your deployment platform.

## Troubleshooting

### Common Issues

1. **Empty Profile Data**: System automatically falls back to enhanced mock data
2. **Chat Not Working**: Ensure profile is analyzed first
3. **API Errors**: Check environment variables and API token validity
4. **Memory Loss**: File persistence ensures data survives development restarts

### Debug Steps

1. **Check Health**: Visit `/api/mcp-health` to verify system status
2. **Inspect Memory**: Visit `/api/debug-memory` to see stored profiles
3. **Test Config**: Visit `/api/test-config` to validate environment setup
4. **Console Logs**: Check browser and server console for detailed error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

This tool is for educational and research purposes. Always respect Instagram's terms of service and user privacy when scraping social media data. Bright Data ensures compliance with data protection regulations and website terms of service.

## Support

- **Bright Data Documentation**: [docs.brightdata.com](https://docs.brightdata.com)
- **Bright Data MCP Guide**: [docs.brightdata.com/api-reference/MCP-Server](https://docs.brightdata.com/api-reference/MCP-Server)
- **OpenAI API Documentation**: [platform.openai.com](https://platform.openai.com)
- **Model Context Protocol**: [spec.modelcontextprotocol.io](https://spec.modelcontextprotocol.io)

---

## 🎉 Current Status: Fully Functional

The Social Persona Engine is now fully operational with:
- ✅ **Profile Analysis**: Working with smart fallback system
- ✅ **AI Chat**: Responsive persona conversations  
- ✅ **Memory System**: Persistent storage with embeddings
- ✅ **Error Handling**: Robust error management
- ✅ **Development Tools**: Comprehensive debugging capabilities

Ready for production deployment and further feature development!
