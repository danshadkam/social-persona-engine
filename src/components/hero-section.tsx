"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Sparkles, Users, MessageSquare, Brain } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function HeroSection() {
  const [activeFeature, setActiveFeature] = useState(0)

  // Auto-rotate through features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Personality Analysis",
      description: "Understand communication styles and personality traits from social profiles",
      color: "from-primary-500 to-primary-600",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Interest Mapping",
      description: "Discover interests and passions to find common ground",
      color: "from-accent-500 to-accent-600",
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Message Suggestions",
      description: "Get personalized conversation starters that resonate",
      color: "from-success-500 to-success-600",
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Communication Tips",
      description: "Learn how to effectively communicate with each unique personality",
      color: "from-info-500 to-info-600",
    },
  ]

  return (
    <div className="mb-16 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="relative mb-6">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-clip-text text-transparent animate-gradient-x">
            Understand Any Social Profile
          </h1>
          <div className="absolute -top-4 -right-4 animate-float">
            <div className="w-8 h-8 bg-gradient-to-r from-accent-400 to-accent-500 rounded-full opacity-60"></div>
          </div>
          <div className="absolute -bottom-2 -left-6 animate-float" style={{ animationDelay: "2s" }}>
            <div className="w-6 h-6 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full opacity-40"></div>
          </div>
        </div>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          Analyze communication styles, interests, and personality traits from any social media profile with{" "}
          <span className="text-primary-600 font-semibold">AI-powered insights</span>
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="cursor-pointer"
            onClick={() => setActiveFeature(index)}
          >
            <Card
              className={`h-full transition-all duration-300 ${
                activeFeature === index
                  ? "border-primary-300 shadow-lg shadow-primary-200/50 dark:shadow-primary-900/30"
                  : "border-border hover:border-primary-200 dark:hover:border-primary-700"
              } bg-white/80 dark:bg-card/80 backdrop-blur-sm`}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div
                  className={`p-4 rounded-full mb-4 bg-gradient-to-r ${
                    activeFeature === index
                      ? feature.color
                      : "from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600"
                  } text-white transition-all duration-300`}
                >
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mb-8"
      >
        <div className="relative mx-auto w-full max-w-md">
          <Card className="border-2 border-primary-200 dark:border-primary-700 shadow-xl overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-primary-500/20 to-accent-500/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Sample Analysis</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">See what insights you&apos;ll discover</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-gradient-to-r from-primary-200 to-primary-300 dark:from-primary-700 dark:to-primary-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gradient-to-r from-accent-200 to-accent-300 dark:from-accent-700 dark:to-accent-600 rounded w-1/2"></div>
                  <div className="h-3 bg-gradient-to-r from-success-200 to-success-300 dark:from-success-700 dark:to-success-600 rounded w-5/6"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-full p-3 shadow-lg">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
