"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, X, Bot, User, Loader2, AlertCircle, Wifi, WifiOff, Minimize2, Maximize2 } from "lucide-react"
import { useSendMessageMutation, useEndSessionMutation, type ProductRecommendation } from "@/store/services/chatbotApi"
import ProductRecommendationCard from "./product-recommendation-card"
import { useRouter } from "next/navigation"

interface ChatMessage {
  id: string
  type: "user" | "bot" | "error" | "system"
  content: string
  timestamp: Date
  recommendations?: ProductRecommendation[]
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [sessionId, setSessionId] = useState<string>("")
  const [isTyping, setIsTyping] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "disconnected">("unknown")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation()
  const [endSession] = useEndSessionMutation()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const testConnection = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers["authorization"] = `Bearer ${token}`
      }

      const response = await fetch(`${apiUrl}/api/chatbot/chat/chat/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_message: "test connection",
        }),
      })

      if (response.ok) {
        setConnectionStatus("connected")
        return true
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error: any) {
      console.error("Connection test failed:", error)
      setConnectionStatus("disconnected")
      return false
    }
  }

  useEffect(() => {
    if (isOpen && !hasInitialized) {
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        type: "bot",
        content:
          "Hi! I'm your AI shopping assistant. I can help you find products, provide personalized recommendations, and answer questions about our store. What can I help you with today?",
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
      setHasInitialized(true)

      // Test connection
      testConnection()
    }
  }, [isOpen, hasInitialized])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      // Focus input when chat opens
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, isMinimized])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentMessage = inputMessage.trim()
    setInputMessage("")
    setIsTyping(true)

    try {
      const response = await sendMessage({
        session_id: sessionId || undefined,
        user_message: currentMessage,
      }).unwrap()

      // Update session ID if provided
      if (response.session_id && response.session_id !== sessionId) {
        setSessionId(response.session_id)
      }

      // Create bot message with API response
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: response.bot_response,
        timestamp: new Date(),
        recommendations:
          response.recommendations && response.recommendations.length > 0 ? response.recommendations : undefined,
      }

      // Debug logging for recommendations
      console.log("Chatbot received response:", response)
      console.log("Recommendations data:", response.recommendations)

      setMessages((prev) => [...prev, botMessage])
      setConnectionStatus("connected")
    } catch (error: any) {
      console.error("Chat error:", error)
      setConnectionStatus("disconnected")

      let errorContent = "I'm sorry, I encountered an error while processing your message."

      if (error?.status === "FETCH_ERROR" || error?.message?.includes("fetch")) {
        errorContent = "❌ Cannot connect to the server. Please check if the backend is running."
      } else if (error?.status) {
        errorContent += ` (Status: ${error.status})`
      }

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "error",
        content: errorContent,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const handleEndChat = async () => {
    if (sessionId) {
      try {
        await endSession({ session_id: sessionId })
      } catch (error) {
        console.error("Error ending session:", error)
      }
    }

    // Reset everything for a fresh start
    setIsOpen(false)
    setIsMinimized(false)
    setMessages([])
    setSessionId("")
    setHasInitialized(false)
    setConnectionStatus("unknown")
  }

  const handleProductClick = (productId: number) => {
    router.push(`/products/${productId}`)
    setIsOpen(false)
    setIsMinimized(false)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="h-3 w-3 text-green-500" />
      case "disconnected":
        return <WifiOff className="h-3 w-3 text-red-500" />
      default:
        return <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
    }
  }

  const getConnectionText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected"
      case "disconnected":
        return "Disconnected"
      default:
        return "Checking..."
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 animate-pulse"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      {/* Chat Widget */}
      {isOpen && (
        <div 
          className={`fixed bottom-6 right-6 z-50 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
            isMinimized ? 'h-16' : 'h-[500px]'
          }`}
          style={{
            animation: 'slideInUp 0.3s ease-out'
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Shopping Assistant</h3>
                <div className="flex items-center gap-1">
                  {getConnectionIcon()}
                  <p className="text-xs opacity-90">{getConnectionText()}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMinimize}
                className="h-8 w-8 p-0 text-white hover:bg-white/20 transition-colors"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEndChat}
                className="h-8 px-2 text-xs text-white hover:bg-white/20 transition-colors"
              >
                New
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                      style={{
                        animation: 'fadeInUp 0.3s ease-out',
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      <div
                        className={`flex gap-2 max-w-[85%] ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.type === "user"
                              ? "bg-blue-500"
                              : message.type === "error"
                                ? "bg-red-500"
                                : message.type === "system"
                                  ? "bg-gray-500"
                                  : "bg-gradient-to-r from-blue-600 to-purple-600"
                          }`}
                        >
                          {message.type === "user" ? (
                            <User className="h-4 w-4 text-white" />
                          ) : message.type === "error" ? (
                            <AlertCircle className="h-4 w-4 text-white" />
                          ) : message.type === "system" ? (
                            <Wifi className="h-4 w-4 text-white" />
                          ) : (
                            <Bot className="h-4 w-4 text-white" />
                          )}
                        </div>

                        <div className={`flex flex-col ${message.type === "user" ? "items-end" : "items-start"}`}>
                          <div
                            className={`rounded-lg px-3 py-2 max-w-full shadow-sm ${
                              message.type === "user"
                                ? "bg-blue-500 text-white"
                                : message.type === "error"
                                  ? "bg-red-100 text-red-900 border border-red-200"
                                  : message.type === "system"
                                    ? "bg-gray-100 text-gray-900 border border-gray-200"
                                    : "bg-white text-gray-900 shadow-sm border border-gray-200"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">{formatTime(message.timestamp)}</span>

                          {/* Show recommendations from API */}
                          {message.recommendations && message.recommendations.length > 0 && (
                            <div className="mt-3 space-y-2 w-full">
                              <Badge variant="secondary" className="text-xs">
                                Recommended Products ({message.recommendations.length})
                              </Badge>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {message.recommendations
                                  .filter((recommendation: ProductRecommendation) => recommendation && recommendation.id)
                                  .map((recommendation: ProductRecommendation, index: number) => (
                                    <div
                                      key={`${recommendation.id}-${message.id}-${index}`}
                                      style={{
                                        animation: 'slideInRight 0.3s ease-out',
                                        animationDelay: `${index * 0.1}s`
                                      }}
                                    >
                                      <ProductRecommendationCard
                                        recommendation={recommendation}
                                        onProductClick={handleProductClick}
                                      />
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200">
                          <div className="flex items-center gap-1">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-gray-600">Typing...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={connectionStatus === "connected" ? "Type your message..." : "Connect to server first..."}
                    disabled={isSending || connectionStatus === "disconnected"}
                    className="flex-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isSending || connectionStatus === "disconnected"}
                    size="sm"
                    className="px-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Custom CSS for animations */}
          <style jsx>{`
            @keyframes slideInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            @keyframes slideInRight {
              from {
                opacity: 0;
                transform: translateX(20px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>
        </div>
      )}
    </>
  )
}
