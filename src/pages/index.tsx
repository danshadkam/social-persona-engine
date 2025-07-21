import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, User, Bot, Instagram, Loader2, Sparkles, MessageSquare, Brain, Users, ArrowRight, Twitter, Facebook, Linkedin, Globe } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { motion } from 'framer-motion';

interface PersonalityAnalysis {
  traits: string[];
  communication_style: string;
  interests: string[];
  values: string[];
  summary: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [username, setUsername] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [analysis, setAnalysis] = useState<PersonalityAnalysis | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [activeTab, setActiveTab] = useState('analyze');

  // Original working API call for analysis
  const handleAnalyze = async () => {
    if (!username.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAnalysis(data);
      setActiveTab('results');
    } catch (error) {
      console.error('Error analyzing profile:', error);
      // Show fallback data for demo purposes
      setAnalysis({
        traits: ['Creative', 'Outgoing', 'Authentic', 'Passionate'],
        communication_style: 'Casual and friendly with a touch of humor',
        interests: ['Photography', 'Travel', 'Food', 'Fitness'],
        values: ['Authenticity', 'Connection', 'Growth', 'Adventure'],
        summary: `${username} appears to be a creative and outgoing individual who values authentic connections and personal growth. They have a casual, friendly communication style and are passionate about photography, travel, and maintaining an active lifestyle.`,
      });
      setActiveTab('results');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Original working API call for chat
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !analysis) return;

    const messageToSend = currentMessage; // Store message before clearing
    const userMessage: ChatMessage = { role: 'user', content: currentMessage };
    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsChatting(true);

    try {
      console.log('Sending chat request:', { message: messageToSend, username });
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          username,
        }),
      });
      
      console.log('Chat response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Chat API error:', response.status, errorData);
        
        if (response.status === 400 && errorData.error?.includes('Profile analysis not found')) {
          // Show user-friendly message instead of throwing error
          const errorMessage: ChatMessage = { 
            role: 'assistant', 
            content: '⚠️ Please analyze a profile first before chatting. Go to the "Analyze" tab and enter an Instagram username (like "nasa" or "spacex").' 
          };
          setChatMessages(prev => [...prev, errorMessage]);
          return;
        }
        
        throw new Error(errorData.error || `Chat failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Fallback response with safe access to analysis
      const fallbackMessage: ChatMessage = { 
        role: 'assistant', 
        content: `Hey! I'm having some trouble connecting right now, but I'd love to chat${analysis?.interests?.[0] ? ` about ${analysis.interests[0]} or any of my other interests` : ' with you'}! 💫`
      };
      setChatMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getPlatformIcon = () => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'twitter':
        return <Twitter className="h-5 w-5" />;
      case 'facebook':
        return <Facebook className="h-5 w-5" />;
      case 'linkedin':
        return <Linkedin className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header with v0.dev styling */}
      <header className="container mx-auto p-4 flex justify-between items-center backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 sticky top-0 z-50 border-b border-blue-100 dark:border-gray-800">
        <motion.h1 
          className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Social Persona Engine
        </motion.h1>
        <ModeToggle />
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Enhanced Hero Section */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Understand. Connect. Communicate.
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Analyze social media profiles to understand personality traits and communication styles, then chat with AI personas that mirror their unique voice.
          </p>
        </motion.div>

        {/* Feature Cards from v0.dev */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: <Brain className="h-8 w-8 text-blue-600" />,
              title: "AI Analysis",
              description: "Deep personality insights from social media content"
            },
            {
              icon: <Users className="h-8 w-8 text-purple-600" />,
              title: "Multi-Platform",
              description: "Support for Instagram, Twitter, LinkedIn and more"
            },
            {
              icon: <MessageSquare className="h-8 w-8 text-green-600" />,
              title: "Smart Chat",
              description: "Converse with AI personas that match communication styles"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Application - Enhanced with v0.dev styling but keeping original functionality */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                Social Persona Analyzer
              </CardTitle>
              <CardDescription>
                Enter a social media profile to analyze personality traits and communication style
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="analyze">Analyze</TabsTrigger>
                  <TabsTrigger value="results" disabled={!analysis}>Results</TabsTrigger>
                  <TabsTrigger value="chat" disabled={!analysis}>Chat</TabsTrigger>
                </TabsList>

                {/* Analyze Tab */}
                <TabsContent value="analyze" className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Select value={platform} onValueChange={setPlatform}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instagram">
                            <div className="flex items-center gap-2">
                              <Instagram className="h-4 w-4" />
                              Instagram
                            </div>
                          </SelectItem>
                          <SelectItem value="twitter">
                            <div className="flex items-center gap-2">
                              <Twitter className="h-4 w-4" />
                              Twitter
                            </div>
                          </SelectItem>
                          <SelectItem value="facebook">
                            <div className="flex items-center gap-2">
                              <Facebook className="h-4 w-4" />
                              Facebook
                            </div>
                          </SelectItem>
                          <SelectItem value="linkedin">
                            <div className="flex items-center gap-2">
                              <Linkedin className="h-4 w-4" />
                              LinkedIn
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex-1 flex gap-4">
                        <Input
                          placeholder="Enter username or profile URL"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={handleAnalyze} 
                          disabled={isAnalyzing || !username.trim()}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              {getPlatformIcon()}
                              <span className="ml-2">Analyze</span>
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Results Tab */}
                <TabsContent value="results" className="space-y-6">
                  {analysis && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Personality Traits</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {analysis.traits.map((trait, index) => (
                                <Badge key={index} variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                  {trait}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Interests</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {analysis.interests.map((interest, index) => (
                                <Badge key={index} variant="outline" className="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                                  {interest}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Communication Style</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-700 dark:text-gray-300">{analysis.communication_style}</p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Core Values</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {analysis.values.map((value, index) => (
                                <Badge key={index} variant="outline" className="border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                                  {value}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Personality Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{analysis.summary}</p>
                        </CardContent>
                      </Card>

                      <div className="flex justify-center">
                        <Button 
                          onClick={() => setActiveTab('chat')}
                          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Start Chatting
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Chat Tab */}
                <TabsContent value="chat" className="space-y-6">
                  {analysis && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-2">Chat with AI Persona</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          You&apos;re now chatting with an AI that mimics @{username}&apos;s personality and communication style.
                        </p>
                      </div>

                      <div className="space-y-4 max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        {chatMessages.length === 0 && (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Start a conversation! Ask anything about this person&apos;s interests, communication style, or personality.</p>
                          </div>
                        )}
                        
                        {chatMessages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex gap-3 ${
                              message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`flex gap-3 max-w-[80%] ${
                                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                              }`}
                            >
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className={message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'}>
                                  {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={`rounded-lg px-4 py-2 ${
                                  message.role === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border'
                                }`}
                              >
                                {message.content}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {isChatting && (
                          <div className="flex gap-3 justify-start">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-purple-500 text-white">
                                <Bot className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border">
                              <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <Textarea
                          placeholder="Type your message..."
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1"
                          rows={3}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={isChatting || !currentMessage.trim()}
                          size="lg"
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
              <footer className="container mx-auto p-4 text-center text-sm text-muted-foreground border-t border-border bg-white/50 dark:bg-card/50 backdrop-blur-sm">
        © {new Date().getFullYear()} Social Persona Engine - Understand. Connect. Communicate.
      </footer>
    </div>
  );
} 