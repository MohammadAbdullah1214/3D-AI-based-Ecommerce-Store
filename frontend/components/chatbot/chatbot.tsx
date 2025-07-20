"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
  Minimize2,
  Maximize2,
} from "lucide-react"
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
        return <Wifi className="h-3 w-3" style={{ color: "#F3C998" }} />
      case "disconnected":
        return <WifiOff className="h-3 w-3 text-red-400" />
      default:
        return <Loader2 className="h-3 w-3 animate-spin text-white/60" />
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
      {/* Floating Chat Button - Always visible in bottom right */}
      <>
        {!isOpen && (
          <div
            className="fixed z-[9999]"
            style={{
              bottom: "24px",
              right: "24px",
              position: "fixed",
            }}
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="rounded-full w-14 h-14 shadow-2xl hover:shadow-2xl transition-all duration-300 animate-pulse border border-white/20"
              style={{
                backgroundColor: "#F3C998",
                color: "#1D212D",
                boxShadow: `0 25px 50px -12px rgba(243, 201, 152, 0.3)`,
              }}
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </div>
        )}
        {isOpen && (
          <div
            className={`fixed z-[9999] w-96 rounded-lg shadow-2xl border border-white/10 flex flex-col overflow-hidden transition-all duration-300 ease-in-out backdrop-blur-xl ${
              isMinimized ? "h-16" : "h-[500px]"
            }`}
            style={{
              bottom: "0px",
              right: "0px",
              position: "fixed",
              backgroundColor: "rgba(29, 33, 45, 0.95)",
              boxShadow: `0 25px 50px -12px rgba(243, 201, 152, 0.2)`
            }}
          >
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute top-4 left-8 w-2 h-2 rounded-full opacity-20"
                style={{ backgroundColor: "#F3C998" }}
              ></div>
              <div
                className="absolute top-8 right-12 w-1 h-1 rounded-full opacity-30"
                style={{ backgroundColor: "#F3C998" }}
              ></div>
              <div
                className="absolute bottom-20 left-6 w-1.5 h-1.5 rounded-full opacity-15"
                style={{ backgroundColor: "#F3C998" }}
              ></div>
              <div className="absolute top-6 right-20">
                <div
                  className="w-1.5 h-1.5 opacity-20"
                  style={{
                    backgroundColor: "#F3C998",
                    clipPath:
                      "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                  }}
                ></div>
              </div>
            </div>

            {/* Header */}
            <div
              className="text-white p-4 flex items-center justify-between backdrop-blur-sm border-b border-white/10 relative z-10"
              style={{ backgroundColor: "rgba(243, 201, 152, 0.9)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20"
                  style={{ backgroundColor: "rgba(29, 33, 45, 0.8)" }}
                >
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: "#1D212D" }}>
                    AI Shopping Assistant
                  </h3>
                  <div className="flex items-center gap-1">
                    {getConnectionIcon()}
                    <p className="text-xs opacity-80" style={{ color: "#1D212D" }}>
                      {getConnectionText()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  className="h-8 w-8 p-0 hover:bg-black/10 transition-colors"
                  style={{ color: "#1D212D" }}
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEndChat}
                  className="h-8 px-2 text-xs hover:bg-black/10 transition-colors"
                  style={{ color: "#1D212D" }}
                >
                  New
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0 hover:bg-black/10 transition-colors"
                  style={{ color: "#1D212D" }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Content */}
            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div
                  className="flex-1 overflow-y-auto p-4 relative z-10"
                  style={{ backgroundColor: "rgba(243, 201, 152, 0.05)" }}
                >
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex gap-2 max-w-[85%] ${message.type === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/20`}
                            style={{
                              backgroundColor:
                                message.type === "user"
                                  ? "#F3C998"
                                  : message.type === "error"
                                    ? "rgba(239, 68, 68, 0.8)"
                                    : message.type === "system"
                                      ? "rgba(107, 114, 128, 0.8)"
                                      : "rgba(243, 201, 152, 0.8)",
                            }}
                          >
                            {message.type === "user" ? (
                              <User className="h-4 w-4" style={{ color: "#1D212D" }} />
                            ) : message.type === "error" ? (
                              <AlertCircle className="h-4 w-4 text-white" />
                            ) : message.type === "system" ? (
                              <Wifi className="h-4 w-4 text-white" />
                            ) : (
                              <Bot className="h-4 w-4" style={{ color: "#1D212D" }} />
                            )}
                          </div>
                          <div className={`flex flex-col ${message.type === "user" ? "items-end" : "items-start"}`}>
                            <div
                              className={`rounded-lg px-3 py-2 max-w-full shadow-sm backdrop-blur-sm border border-white/10`}
                              style={{
                                backgroundColor:
                                  message.type === "user"
                                    ? "rgba(243, 201, 152, 0.9)"
                                    : message.type === "error"
                                      ? "rgba(239, 68, 68, 0.2)"
                                      : message.type === "system"
                                        ? "rgba(107, 114, 128, 0.2)"
                                        : "rgba(29, 33, 45, 0.8)",
                                color: message.type === "user" ? "#1D212D" : "white",
                              }}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            </div>
                            <span className="text-xs text-white/60 mt-1">{formatTime(message.timestamp)}</span>
                            {/* Show recommendations from API */}
                            {message.recommendations && message.recommendations.length > 0 && (
                              <div className="mt-3 space-y-2 w-full">
                                <Badge
                                  className="text-xs border-white/20"
                                  style={{ backgroundColor: "rgba(243, 201, 152, 0.2)", color: "#F3C998" }}
                                >
                                  Recommended Products ({message.recommendations.length})
                                </Badge>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {message.recommendations
                                    .filter(
                                      (recommendation: ProductRecommendation) => recommendation && recommendation.id,
                                    )
                                    .map((recommendation: ProductRecommendation, index: number) => (
                                      <div key={`${recommendation.id}-${message.id}-${index}`}>
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
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20"
                            style={{ backgroundColor: "rgba(243, 201, 152, 0.8)" }}
                          >
                            <Bot className="h-4 w-4" style={{ color: "#1D212D" }} />
                          </div>
                          <div
                            className="rounded-lg px-3 py-2 shadow-sm backdrop-blur-sm border border-white/10"
                            style={{ backgroundColor: "rgba(29, 33, 45, 0.8)" }}
                          >
                            <div className="flex items-center gap-1">
                              <Loader2 className="h-4 w-4 animate-spin text-white/80" />
                              <span className="text-sm text-white/80">Typing...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div
                  className="p-4 border-t border-white/10 backdrop-blur-sm relative z-10"
                  style={{ backgroundColor: "rgba(29, 33, 45, 0.8)" }}
                >
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        connectionStatus === "connected" ? "Type your message..." : "Connect to server first..."
                      }
                      disabled={isSending || connectionStatus === "disconnected"}
                      className="flex-1 text-sm bg-white/5 backdrop-blur-sm border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all text-white placeholder:text-white/60"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isSending || connectionStatus === "disconnected"}
                      size="sm"
                      className="px-3 transition-all duration-200 border border-white/20 shadow-lg"
                      style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
                    >
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </>
    </>
  )
}
