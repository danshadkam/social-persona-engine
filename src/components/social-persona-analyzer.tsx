"use client"

import { useState } from "react"
import { Loader2, ArrowRight, Instagram, Twitter, Facebook, Linkedin, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import ChatInterface from "@/components/chat-interface"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data for demonstration purposes
const mockAnalysisResults = {
  estimatedAge: "25-30",
  interests: ["Photography", "Travel", "Fitness", "Food"],
  vibe: "Adventurous, outgoing, creative with a touch of sophistication",
  suggestedMessage: "Hey there! I noticed your amazing travel photos. What's been your favorite destination so far?",
  communicationTips:
    "This person responds well to genuine questions about their interests. Keep messages concise and reference specific content from their profile.",
}

export default function SocialPersonaAnalyzer() {
  const [profileUrl, setProfileUrl] = useState("")
  const [platform, setPlatform] = useState("any")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<typeof mockAnalysisResults | null>(null)
  const [activeTab, setActiveTab] = useState("results")

  const handleAnalyze = () => {
    if (!profileUrl) return

    setIsAnalyzing(true)
    setAnalysisResults(null)

    // Simulate API call with timeout
    setTimeout(() => {
      setAnalysisResults(mockAnalysisResults)
      setIsAnalyzing(false)
      setActiveTab("results")
    }, 2000)
  }

  const getPlatformIcon = () => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-5 w-5" />
      case "twitter":
        return <Twitter className="h-5 w-5" />
      case "facebook":
        return <Facebook className="h-5 w-5" />
      case "linkedin":
        return <Linkedin className="h-5 w-5" />
      default:
        return <Globe className="h-5 w-5" />
    }
  }

  return (
    <motion.div
      className="space-y-6 mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-2 border-primary-200 dark:border-primary-700 overflow-hidden shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardContent className="p-0">
          <motion.div className="bg-gradient-to-r from-primary-500/10 via-accent-500/10 to-primary-500/10 p-8 space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-semibold mb-2 bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Analyze Any Social Profile
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Understand personality, interests, and communication style
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-2">
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="w-[140px] border-primary-200 dark:border-primary-700 bg-white/80 dark:bg-gray-800/80">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Platform</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500">
                    {getPlatformIcon()}
                  </div>
                  <Input
                    placeholder="Paste any social profile username or link"
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                    className="pl-10 border-primary-200 dark:border-primary-700 bg-white/80 dark:bg-gray-800/80 focus:border-primary-400 dark:focus:border-primary-500"
                  />
                </div>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !profileUrl}
                className="sm:w-auto w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  <>
                    Analyze
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {(isAnalyzing || analysisResults) && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-primary-200 dark:border-primary-700">
            <TabsTrigger
              value="results"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-500 data-[state=active]:to-accent-500 data-[state=active]:text-white"
            >
              Analysis Results
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-500 data-[state=active]:to-accent-500 data-[state=active]:text-white"
            >
              Chat Assistant
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-4">
            {isAnalyzing ? (
              <motion.div
                className="h-64 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary-500 mb-4" />
                  <div className="absolute inset-0 h-12 w-12 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 opacity-20 animate-ping"></div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">Analyzing profile data...</p>
              </motion.div>
            ) : analysisResults ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-primary-200 dark:border-primary-700 shadow-lg">
                  <CardContent className="pt-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">Estimated Age</h3>
                      <p className="text-lg font-semibold">{analysisResults.estimatedAge}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisResults.interests.map((interest, index) => (
                          <motion.span
                            key={index}
                            className="bg-gradient-to-r from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full text-sm font-medium border border-primary-200 dark:border-primary-700"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                          >
                            {interest}
                          </motion.span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">
                        Vibe / Personality
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{analysisResults.vibe}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">
                        Suggested First Message
                      </h3>
                      <div className="bg-gradient-to-r from-accent-50 to-primary-50 dark:from-accent-950/20 dark:to-primary-950/20 p-4 rounded-lg border border-accent-200 dark:border-accent-700">
                        <p className="italic text-gray-700 dark:text-gray-300">&ldquo;{analysisResults.suggestedMessage}&rdquo;</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">
                        Communication Tips
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {analysisResults.communicationTips}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : null}
          </TabsContent>

          <TabsContent value="chat">{analysisResults && <ChatInterface username={profileUrl} />}</TabsContent>
        </Tabs>
      )}
    </motion.div>
  )
}
