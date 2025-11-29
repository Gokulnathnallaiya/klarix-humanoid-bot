'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRobot } from '@/components/providers/RobotProvider'
import { 
  Mic, MicOff, Volume2, VolumeX, Loader2, StopCircle,
  Bot, X, Minimize2, Maximize2
} from 'lucide-react'
import { tts, sfx } from '@/lib/speechServices'

// Speech Recognition types for browser compatibility
type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : any
type SpeechRecognitionInstance = InstanceType<SpeechRecognitionType> | null

interface ConversationItem {
  id: string
  type: 'user' | 'assistant'
  text: string
  commands?: Array<{ type: string; action: string; success?: boolean }>
  timestamp: Date
}

const API_BASE = 'http://localhost:8000'

export default function VoiceAssistant() {
  const { connectionState, status, sendCommand } = useRobot()
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [transcript, setTranscript] = useState('')
  const [conversation, setConversation] = useState<ConversationItem[]>([])
  const [isMinimized, setIsMinimized] = useState(false)
  const [showPanel, setShowPanel] = useState(true)
  const recognitionRef = useRef<SpeechRecognitionInstance>(null)
  const isConnected = connectionState === 'connected'

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI()
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event: any) => {
          let interimTranscript = ''
          let finalTranscript = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }
          
          setTranscript(interimTranscript || finalTranscript)
          
          if (finalTranscript) {
            handleVoiceCommand(finalTranscript.trim())
          }
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          if (event.error !== 'no-speech') {
            if (voiceEnabled) tts.speak("Sorry, I didn't catch that")
          }
        }

        recognition.onend = () => {
          setIsListening(false)
        }
        
        recognitionRef.current = recognition
      }
    }
  }, [voiceEnabled])

  // Handle voice command
  const handleVoiceCommand = async (text: string) => {
    if (!text.trim() || isProcessing) return
    
    // Add user message to conversation
    const userItem: ConversationItem = {
      id: Date.now().toString(),
      type: 'user',
      text: text,
      timestamp: new Date()
    }
    setConversation(prev => [...prev.slice(-9), userItem]) // Keep last 10 items
    setTranscript('')
    setIsProcessing(true)
    
    // Quick local STOP check for immediate response
    const lowerText = text.toLowerCase()
    if (lowerText.includes('stop') || lowerText.includes('halt') || lowerText.includes('freeze')) {
      // Immediate stop - don't wait for AI
      try {
        await fetch(`${API_BASE}/api/robot/stop`, { method: 'POST' })
        if (voiceEnabled) {
          await sfx.acknowledge()
          tts.speak("Stopping!")
        }
        setConversation(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: 'Stopping!',
          commands: [{ type: 'stop', action: 'stop', success: true }],
          timestamp: new Date()
        }])
        setIsProcessing(false)
        return
      } catch (e) {
        console.error('Stop failed:', e)
      }
    }

    try {
      // Call AI backend
      const response = await fetch(`${API_BASE}/api/robot/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          robot_status: {
            battery: status.battery,
            temperature: status.temperature,
            is_moving: status.is_moving,
            connected: status.connected
          }
        })
      })

      const data = await response.json()
      const responseText = data.response || "I'm not sure what you mean."
      
      // Get executed commands
      const commands = data.commands || []
      const executed = data.executed || []
      
      const assistantItem: ConversationItem = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: responseText,
        commands: commands
          .filter((c: { type: string }) => c.type !== 'none')
          .map((c: { type: string; action: string }, i: number) => ({
            type: c.type,
            action: c.action,
            success: executed.find((e: { index: number }) => e.index === i)?.success
          })),
        timestamp: new Date()
      }
      
      setConversation(prev => [...prev.slice(-9), assistantItem])

      // Speak response
      if (voiceEnabled && responseText) {
        await sfx.acknowledge()
        // Clean for speech (remove emojis)
        const cleanText = responseText.replace(/[^\w\s.,!?'-]/g, '').trim()
        await tts.speakAsRobot(cleanText)
      }

    } catch (error) {
      console.error('AI error:', error)
      const errorMsg = "Sorry, I couldn't process that."
      setConversation(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: errorMsg,
        timestamp: new Date()
      }])
      if (voiceEnabled) tts.speak(errorMsg)
    } finally {
      setIsProcessing(false)
    }
  }

  // Toggle listening
  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current || !isConnected) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      if (voiceEnabled) await sfx.listeningEnd()
    } else {
      tts.stop() // Stop any current speech
      setTranscript('')
      if (voiceEnabled) await sfx.listeningStart()
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        console.error('Failed to start recognition:', e)
      }
    }
  }, [isListening, isConnected, voiceEnabled])

  // Emergency stop button
  const handleEmergencyStop = async () => {
    try {
      tts.stop()
      await fetch(`${API_BASE}/api/robot/stop`, { method: 'POST' })
      if (voiceEnabled) {
        await sfx.error()
        tts.speak("Emergency stop!")
      }
      setConversation(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        text: '🛑 Emergency Stop!',
        commands: [{ type: 'stop', action: 'stop', success: true }],
        timestamp: new Date()
      }])
    } catch (e) {
      console.error('Emergency stop failed:', e)
    }
  }

  // Keyboard shortcut for push-to-talk (Space bar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        if (!isListening && isConnected) {
          toggleListening()
        }
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        if (isListening) {
          recognitionRef.current?.stop()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isListening, isConnected, toggleListening])

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-40 p-4 rounded-full 
          bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg
          hover:scale-110 transition-all animate-pulse"
      >
        <Mic className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className={`fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-50 
      ${isMinimized ? 'w-auto' : 'w-[calc(100vw-2rem)] max-w-sm'}
      bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden
      transition-all duration-300`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isListening 
              ? 'bg-red-500 animate-pulse' 
              : isProcessing 
                ? 'bg-yellow-500 animate-spin' 
                : 'bg-gradient-to-br from-cyan-500 to-blue-600'
          }`}>
            {isProcessing ? <Loader2 className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
          </div>
          {!isMinimized && (
            <div>
              <h3 className="text-sm font-semibold text-white">Klarix Voice</h3>
              <p className="text-xs text-slate-400">
                {isListening ? '🎤 Listening...' : isProcessing ? '🤔 Thinking...' : 'Say a command'}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Voice Toggle */}
          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled)
              if (voiceEnabled) tts.stop()
            }}
            className={`p-1.5 rounded-lg transition ${voiceEnabled ? 'text-cyan-400' : 'text-slate-500'}`}
            title={voiceEnabled ? 'Voice ON' : 'Voice OFF'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          {/* Minimize */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          
          {/* Close */}
          <button
            onClick={() => setShowPanel(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Conversation */}
          <div className="h-48 overflow-y-auto p-3 space-y-2">
            {conversation.length === 0 && (
              <div className="text-center text-slate-500 text-sm py-8">
                <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Press the mic or hold Space to talk</p>
                <p className="text-xs mt-1">Try: "Wave at me" or "Walk forward"</p>
              </div>
            )}
            {conversation.map((item) => (
              <div key={item.id} className={`flex ${item.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  item.type === 'user' 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-slate-800 text-slate-200'
                }`}>
                  <p className="text-sm">{item.text}</p>
                  {item.commands && item.commands.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.commands.map((cmd, i) => (
                        <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${
                          cmd.success ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {cmd.type}: {cmd.action}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Current transcript */}
            {transcript && (
              <div className="flex justify-end">
                <div className="bg-cyan-500/50 text-white rounded-xl px-3 py-2 max-w-[85%]">
                  <p className="text-sm italic">{transcript}...</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-3 border-t border-white/10 space-y-3">
            {/* Main Control Buttons */}
            <div className="flex items-center justify-center gap-3">
              {/* Emergency Stop */}
              <button
                onClick={handleEmergencyStop}
                disabled={!isConnected}
                className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 
                  transition-all disabled:opacity-50 border border-red-500/30"
                title="Emergency Stop"
              >
                <StopCircle className="w-5 h-5" />
              </button>
              
              {/* Main Mic Button */}
              <button
                onClick={toggleListening}
                disabled={!isConnected || isProcessing}
                className={`p-5 rounded-full transition-all transform ${
                  isListening
                    ? 'bg-red-500 scale-110 animate-pulse shadow-lg shadow-red-500/50'
                    : 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:scale-105 shadow-lg shadow-cyan-500/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isListening ? <MicOff className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
              </button>
              
              {/* Quick Wave */}
              <button
                onClick={() => handleVoiceCommand('wave')}
                disabled={!isConnected || isProcessing}
                className="p-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 
                  transition-all disabled:opacity-50 border border-white/10"
                title="Quick Wave"
              >
                👋
              </button>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
              <span className={isConnected ? 'text-emerald-400' : 'text-red-400'}>
                {isConnected ? '● Connected' : '○ Disconnected'}
              </span>
              <span>Hold Space to talk</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
