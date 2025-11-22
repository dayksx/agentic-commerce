"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function A2AChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your A2A chatbot. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/a2a", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "I received your message.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-white rounded-[32px] border border-white/50 shadow-[0_20px_40px_-10px_rgba(45,43,66,0.05)] h-full flex flex-col overflow-hidden">
      <div className="p-8 border-b border-[#F0F0F5]">
        <h3 className="text-2xl font-bold text-[#2D2B42] tracking-tight">Chat</h3>
        <p className="text-sm text-[#8F8F9D] mt-1">Agent-to-Agent communication</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#F472B6] flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-gradient-to-r from-[#A78BFA] to-[#F472B6] text-white"
                  : "bg-[#FAFAFC] text-[#2D2B42]"
              }`}
            >
              {message.role === "assistant" ? (
                <div className="text-sm markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0">{children}</h3>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="ml-2">{children}</li>,
                      code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="bg-[#F0F0F5] text-[#A78BFA] px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                        ) : (
                          <code className={className}>{children}</code>
                        );
                      },
                      pre: ({ children }) => (
                        <pre className="bg-[#F0F0F5] p-3 rounded-lg overflow-x-auto mb-2 text-xs font-mono">
                          {children}
                        </pre>
                      ),
                      a: ({ href, children }) => (
                        <a href={href} className="text-[#A78BFA] underline hover:text-[#8B5CF6]" target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-[#A78BFA] pl-3 italic text-[#8F8F9D] my-2">
                          {children}
                        </blockquote>
                      ),
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      hr: () => <hr className="my-3 border-[#F0F0F5]" />,
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-2">
                          <table className="min-w-full border-collapse border border-[#F0F0F5]">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => <thead className="bg-[#F0F0F5]">{children}</thead>,
                      tbody: ({ children }) => <tbody>{children}</tbody>,
                      tr: ({ children }) => <tr className="border-b border-[#F0F0F5]">{children}</tr>,
                      th: ({ children }) => <th className="border border-[#F0F0F5] px-2 py-1 text-left font-bold">{children}</th>,
                      td: ({ children }) => <td className="border border-[#F0F0F5] px-2 py-1">{children}</td>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
              <p className={`text-[10px] mt-1 ${message.role === "user" ? "text-white/70" : "text-[#8F8F9D]"}`}>
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-[#F0F0F5] flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-[#8F8F9D]" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#F472B6] flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-[#FAFAFC] rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-[#A78BFA] animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#A78BFA] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#A78BFA] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 border-t border-[#F0F0F5]">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 rounded-2xl bg-[#FAFAFC] border border-[#F0F0F5] focus:outline-none focus:ring-2 focus:ring-[#A78BFA] focus:border-transparent text-sm text-[#2D2B42] placeholder:text-[#8F8F9D]"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-[#A78BFA] to-[#F472B6] text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

