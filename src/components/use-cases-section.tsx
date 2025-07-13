"use client"

import { motion } from "framer-motion"
import { Heart, Briefcase, ShoppingCart, Users, MessageCircle, Target } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function UseCasesSection() {
  const useCases = [
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Dating & Relationships",
      description: "Craft the perfect first message and understand compatibility before you connect.",
      color: "from-pink-500 to-rose-500",
      bgColor: "from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20",
      examples: ["Dating apps", "Social meetups", "Relationship building"],
    },
    {
      icon: <Briefcase className="h-8 w-8" />,
      title: "Professional Networking",
      description: "Build meaningful professional relationships with personalized outreach strategies.",
      color: "from-blue-500 to-indigo-500",
      bgColor: "from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20",
      examples: ["LinkedIn outreach", "Conference networking", "Career opportunities"],
    },
    {
      icon: <ShoppingCart className="h-8 w-8" />,
      title: "Sales & Marketing",
      description: "Increase conversion rates with personalized sales approaches and targeted messaging.",
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
      examples: ["Cold outreach", "Lead qualification", "Customer personas"],
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Team Building",
      description: "Understand team dynamics and communication preferences for better collaboration.",
      color: "from-purple-500 to-violet-500",
      bgColor: "from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20",
      examples: ["Remote teams", "Project management", "Workplace culture"],
    },
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: "Customer Support",
      description: "Provide personalized customer service by understanding communication styles.",
      color: "from-orange-500 to-amber-500",
      bgColor: "from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20",
      examples: ["Support tickets", "Client relations", "User experience"],
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Content Creation",
      description: "Create content that resonates with your audience by understanding their preferences.",
      color: "from-teal-500 to-cyan-500",
      bgColor: "from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20",
      examples: ["Social media", "Influencer marketing", "Brand messaging"],
    },
  ]

  return (
    <section className="py-16 mt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
          Endless Possibilities
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Discover how Social Persona Engine can transform your communication across different scenarios
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {useCases.map((useCase, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="group"
          >
            <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <div
                  className={`bg-gradient-to-br ${useCase.bgColor} p-6 transition-all duration-300 group-hover:scale-105`}
                >
                  <div
                    className={`inline-flex p-3 rounded-full bg-gradient-to-r ${useCase.color} text-white mb-4 shadow-lg`}
                  >
                    {useCase.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">{useCase.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{useCase.description}</p>
                  <div className="space-y-2">
                    {useCase.examples.map((example, exampleIndex) => (
                      <div
                        key={exampleIndex}
                        className="inline-block bg-white/60 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm mr-2 mb-2"
                      >
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        viewport={{ once: true }}
        className="text-center mt-12"
      >
        <Card className="bg-gradient-to-r from-primary-500 to-accent-500 text-white border-0 shadow-xl">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Communication?</h3>
            <p className="text-lg opacity-90 mb-6">
              Join thousands of users who are already building better connections with AI-powered insights.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="bg-white/20 px-4 py-2 rounded-full">✨ Instant Analysis</span>
              <span className="bg-white/20 px-4 py-2 rounded-full">🎯 Personalized Tips</span>
              <span className="bg-white/20 px-4 py-2 rounded-full">💬 Better Conversations</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  )
}
