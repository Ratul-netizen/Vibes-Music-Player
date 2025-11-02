"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageSquare, X } from "lucide-react"
import { ChatMessage, type Message } from "@/components/chat-message"
import { motion } from "framer-motion"

interface ChatPanelProps {
  messages: Message[]
  currentUserId: string
  currentUserName: string
  onSendMessage: (content: string) => void
  isTyping?: boolean
  typingUser?: string
  onClose?: () => void
}

export function ChatPanel({
  messages,
  currentUserId,
  currentUserName,
  onSendMessage,
  isTyping,
  typingUser,
  onClose,
}: ChatPanelProps) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input)
      setInput("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isContinuation = (currentIdx: number) => {
    if (currentIdx === 0) return false
    const current = messages[currentIdx]
    const previous = messages[currentIdx - 1]
    return current.userId === previous.userId && current.timestamp.getTime() - previous.timestamp.getTime() < 60000
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="h-full"
    >
      <Card className="glass p-4 h-full flex flex-col border border-white/10">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
          <MessageSquare className="w-4 h-4 text-purple-500" />
          <h3 className="font-semibold text-sm">Live Chat</h3>
          <div className="ml-auto text-xs text-muted-foreground">{messages.length} messages</div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-white ml-2"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

      <ScrollArea className="flex-1 pr-4 mb-3" ref={scrollRef}>
        <div className="space-y-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground opacity-50 mb-2" />
              <p className="text-sm text-muted-foreground">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((message, idx) => (
              <ChatMessage
                key={message.id}
                message={message}
                isCurrentUser={message.userId === currentUserId}
                isContinuation={isContinuation(idx)}
              />
            ))
          )}

          {isTyping && (
            <div className="flex gap-2 pt-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {typingUser?.charAt(0).toUpperCase()}
              </div>
              <div className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce delay-100">•</span>
                <span className="animate-bounce delay-200">•</span>
                <span className="text-xs ml-1">{typingUser} is typing...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-sm"
        />
        <Button size="sm" onClick={handleSend} className="px-3">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
    </motion.div>
  )
}
