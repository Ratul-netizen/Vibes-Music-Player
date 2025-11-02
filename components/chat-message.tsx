"use client"

import { Card } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { motion } from "framer-motion"

export interface Message {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: Date
  type: "message" | "system" | "reaction"
}

interface ChatMessageProps {
  message: Message
  isCurrentUser: boolean
  isContinuation: boolean
}

export function ChatMessage({ message, isCurrentUser, isContinuation }: ChatMessageProps) {
  const formatTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true })
  }

  if (message.type === "system") {
    return (
      <div className="flex justify-center py-2">
        <p className="text-xs text-muted-foreground italic">{message.content}</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      className={`flex gap-2 ${isCurrentUser ? "flex-row-reverse" : ""}`}
    >
      {!isContinuation && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xs font-bold text-white shrink-0 ring-2 ring-purple-500/30"
        >
          {message.userName.charAt(0).toUpperCase()}
        </motion.div>
      )}
      {isContinuation && <div className="w-8 shrink-0" />}

      <div className={`flex flex-col gap-1 max-w-xs ${isCurrentUser ? "items-end" : ""}`}>
        {!isContinuation && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs font-medium"
          >
            {message.userName}
          </motion.p>
        )}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <Card
            className={`p-2 text-sm break-words transition-all hover:shadow-lg ${
              isCurrentUser
                ? "bg-purple-500 text-white rounded-br-none hover:bg-purple-600"
                : "bg-muted text-foreground rounded-bl-none hover:bg-muted/80"
            }`}
          >
            {message.content}
          </Card>
        </motion.div>
        {!isContinuation && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-muted-foreground"
          >
            {formatTime(message.timestamp)}
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}
