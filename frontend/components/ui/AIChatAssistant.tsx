'use client'

import { useState, useRef, useEffect } from 'react'
import { useRobot } from '@/components/providers/RobotProvider'
import { 
  MessageSquare, Send, Bot, User, Loader2, X, Sparkles,
  Hand, ArrowUp, RotateCcw, Eye, Zap, Brain, Volume2, VolumeX, Mic, MicOff
} from 'lucide-react'
import { tts, sfx, voiceFeedback } from '@/lib/speechServices'
import type { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '@/types/speech.d'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  commands?: Array<{
    type: string
    action: string
    executed: boolean
    success?: boolean
  }>
  timestamp: Date
}

const API_BASE = 'http://localhost:8000'

export default function AIChatAssistant() {
  const { connectionState, status } = useRobot()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hi! I'm Klarix AI Assistant, powered by GPT-4. I can understand natural language and control the robot for you.\n\nTry saying things like:\n• \"Wave at me and then walk forward\"\n• \"Can you look around the room?\"\n• \"Turn left and point at something\"\n• \"What's your battery status?\"\n\nHow can I help you?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const isConnected = connectionState === 'connected'

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognitionClass()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
        sfx.listeningEnd()
        // Auto-send after voice input
        setTimeout(() => {
          handleSendWithVoice(transcript)
        }, 300)
      }

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        if (voiceEnabled) {
          voiceFeedback.error("I didn't catch that. Please try again.")
        }
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [voiceEnabled])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const startListening = async () => {
    if (!recognitionRef.current) {
      voiceFeedback.error("Voice input is not supported in this browser.")
      return
    }

    // Stop TTS if speaking
    tts.stop()
    
    setIsListening(true)
    await sfx.listeningStart()
    recognitionRef.current.start()
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  const handleSendWithVoice = async (text: string) => {
    if (!text.trim() || isProcessing) return
    await handleSendMessage(text.trim())
  }

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return
    await handleSendMessage(input.trim())
  }

  const handleSendMessage = async (messageText: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)

    // Play acknowledgment sound
    if (voiceEnabled) {
      await sfx.commandReceived()
    }

    try {
      // Call the AI backend endpoint
      const response = await fetch(`${API_BASE}/api/robot/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          robot_status: {
            battery: status.battery,
            temperature: status.temperature,
            is_moving: status.is_moving,
            connected: status.connected
          }
        })
      })

      const data = await response.json()
      
      // Handle both single command (legacy) and commands array
      const commands = data.commands || (data.command ? [data.command] : [])
      const executedCommands = data.executed || []
      
      const responseText = data.response || "I'm not sure how to respond to that."
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        commands: commands
          .filter((cmd: { type: string }) => cmd && cmd.type !== 'none')
          .map((cmd: { type: string; action: string }, index: number) => {
            const execInfo = executedCommands.find((e: { index: number }) => e.index === index)
            return {
              type: cmd.type,
              action: cmd.action,
              executed: !!execInfo,
              success: execInfo?.success
            }
          }),
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Speak the response if voice is enabled
      if (voiceEnabled) {
        // Clean up response for speaking (remove emojis and markdown)
        const speakText = responseText
          .replace(/[^\w\s.,!?'-]/g, '') // Remove emojis
          .replace(/\n+/g, '. ')          // Replace newlines with pauses
          .trim()
        
        await voiceFeedback.speakResponse(speakText, false)
      }

    } catch (error) {
      console.error('AI Chat error:', error)
      const errorMessage = 'Sorry, I had trouble connecting to the AI service. Please make sure the backend is running.'
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      }])

      if (voiceEnabled) {
        await voiceFeedback.error(errorMessage)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const quickPrompts = [
    { label: 'Wave hello', prompt: 'Can you wave at me?' },
    { label: 'Walk around', prompt: 'Walk forward and then turn around' },
    { label: 'Look around', prompt: 'Look left, then right, then center' },
    { label: 'Status', prompt: "What's your current status?" },
  ]

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-40 p-4 rounded-full 
          bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30
          hover:scale-110 transition-all ${isOpen ? 'hidden' : ''}`}
      >
        <Brain className="w-6 h-6" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-50 w-[calc(100vw-2rem)] max-w-md 
          bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden
          animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-pink-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  Klarix AI
                  <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-300">GPT-4</span>
                </h3>
                <p className="text-xs text-slate-400">Voice-enabled robot control</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Voice Toggle */}
              <button
                onClick={() => {
                  setVoiceEnabled(!voiceEnabled)
                  if (!voiceEnabled) {
                    sfx.acknowledge()
                  } else {
                    tts.stop()
                  }
                }}
                className={`p-2 rounded-lg transition ${
                  voiceEnabled 
                    ? 'bg-purple-500/30 text-purple-300 hover:bg-purple-500/40' 
                    : 'hover:bg-white/10 text-slate-500'
                }`}
                title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {/* Close Button */}
              <button
                onClick={() => {
                  tts.stop()
                  setIsOpen(false)
                }}
                className="p-2 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-cyan-500' 
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Brain className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-cyan-500 text-white rounded-tr-sm'
                      : 'bg-slate-800 text-slate-200 rounded-tl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                  </div>
                  {/* Display executed commands */}
                  {message.commands && message.commands.length > 0 && (
                    <div className={`mt-2 space-y-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                      {message.commands.map((cmd, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-center gap-1 text-xs ${
                            cmd.executed 
                              ? cmd.success ? 'text-emerald-400' : 'text-amber-400'
                              : 'text-slate-500'
                          } ${message.role === 'user' ? 'justify-end' : ''}`}
                        >
                          <Zap className="w-3 h-3" />
                          <span>
                            {cmd.executed 
                              ? `✓ ${cmd.type}: ${cmd.action}`
                              : `Command: ${cmd.action}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                    <span className="text-xs text-slate-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-4 pb-2">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {quickPrompts.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setInput(item.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 
                    text-xs font-medium hover:bg-slate-700 transition whitespace-nowrap border border-white/5"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            {/* Listening indicator */}
            {isListening && (
              <div className="flex items-center justify-center gap-2 mb-3 py-2 bg-purple-500/20 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-75" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-150" />
                </div>
                <span className="text-sm text-purple-300">Listening...</span>
                <button 
                  onClick={stopListening}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Cancel
                </button>
              </div>
            )}
            
            <div className="flex gap-2">
              {/* Mic Button */}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={!isConnected || isProcessing}
                className={`p-2.5 rounded-xl transition-all ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-slate-800 text-slate-400 hover:text-purple-400 hover:bg-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? "Listening..." : (isConnected ? "Type or tap mic to speak..." : "Connect to robot first...")}
                disabled={!isConnected || isProcessing || isListening}
                className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white
                  placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || !isConnected || isProcessing}
                className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white
                  hover:from-purple-600 hover:to-pink-600 transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              {voiceEnabled ? '🔊 Voice responses ON' : '🔇 Voice responses OFF'} • Powered by Azure OpenAI GPT-4
            </p>
          </div>
        </div>
      )}
    </>
  )
}
