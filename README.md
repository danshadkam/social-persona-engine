# Social Persona Engine

A Next.js application that analyzes Instagram profiles to understand personality traits and enables chat conversations with AI personas that mimic the analyzed user's communication style.

## Features

- 🔍 **Instagram Profile Analysis**: Scrapes and analyzes Instagram profiles to extract personality insights
- 🧠 **AI Personality Analysis**: Uses GPT-4 to analyze communication patterns, interests, and values
- 💬 **AI Persona Chat**: Chat with an AI that mimics the analyzed user's personality and communication style
- 📊 **Personality Insights**: Displays traits, communication style, interests, and values
- 🎨 **Modern UI**: Clean, responsive interface built with Tailwind CSS and shadcn/ui

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **AI**: OpenAI GPT-4
- **Scraping**: Puppeteer MCP Server or Firecrawl API
- **Icons**: Lucide React

## Project Structure

```
/social-persona-engine
│
├── /src
│   ├── /pages
│   │   ├── index.tsx              # Main UI page
│   │   ├── api/
│   │   │   ├── analyze.ts         # Profile analysis endpoint
│   │   │   └── chat.ts            # Chat response endpoint
│   ├── /lib
│   │   ├── scraper.ts             # Instagram scraping logic
│   │   ├── agent.ts               # GPT personality analysis
│   │   ├── memory.ts              # Profile data storage
│   │   └── chat.ts                # Chat response logic
│   └── /components/ui/            # shadcn/ui components
│
├── /public                        # Static assets
├── .env.local                     # Environment variables
├── package.json
└── README.md
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key
- MCP Scraper server or Firecrawl API key

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd social-persona-engine

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local
```

### 3. Environment Configuration

Edit `.env.local` with your API keys:

```env
# Required: OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Option 1: MCP Scraper URL (recommended)
MCP_SCRAPER_URL=http://localhost:3001

# Option 2: Firecrawl API Key (alternative)
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Running the Application

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

1. Enter an Instagram username in the input field
2. Click "Analyze" to scrape and analyze the profile
3. View the personality analysis results including:
   - Personality traits
   - Communication style
   - Interests and hobbies
   - Core values
   - Personality summary

### 2. AI Chat

1. After analyzing a profile, the chat interface will appear
2. Type messages to chat with an AI persona that mimics the analyzed user
3. The AI will respond using the personality traits and communication style identified in the analysis

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
  "summary": "Personality summary..."
}
```

### POST /api/chat

Generates chat responses using the analyzed personality.

**Request Body:**
```json
{
  "message": "Hello!",
  "username": "instagram_username",
  "analysis": { /* personality analysis object */ }
}
```

**Response:**
```json
{
  "response": "Hey there! How's it going? 😊"
}
```

## Configuration

### Scraping Options

The application supports two scraping methods:

1. **MCP Puppeteer Server** (Recommended)
   - Set `MCP_SCRAPER_URL` in environment
   - More reliable and customizable
   - Requires running a separate MCP server

2. **Firecrawl API**
   - Set `FIRECRAWL_API_KEY` in environment
   - Easier setup but may have limitations
   - Commercial service with usage limits

### Memory Storage

By default, the application uses in-memory storage for development. For production, consider implementing:

- Redis for session storage
- PostgreSQL for persistent data
- MongoDB for document storage

Example database implementation is provided in `src/lib/memory.ts`.

## Development

### Adding New Features

1. **API Endpoints**: Add new endpoints in `/src/pages/api/`
2. **UI Components**: Create components in `/src/components/`
3. **Utility Functions**: Add utilities in `/src/lib/`

### Customizing Analysis

Modify the personality analysis prompt in `src/lib/agent.ts` to:
- Add new personality dimensions
- Change analysis criteria
- Adjust response format

### Styling

The application uses Tailwind CSS with shadcn/ui components. Customize:
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

### Other Platforms

The application can be deployed on:
- Netlify
- Railway
- Heroku
- AWS/GCP/Azure

Ensure environment variables are properly configured on your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

This tool is for educational and research purposes. Always respect Instagram's terms of service and user privacy when scraping social media data.
