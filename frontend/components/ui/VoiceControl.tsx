'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRobot } from '@/components/providers/RobotProvider'
import { 
  Mic, MicOff, Volume2, Loader2, AlertCircle, 
  Hand, Pointer, User, ArrowUp, ArrowDown, RotateCcw, RotateCw,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye, VolumeX
} from 'lucide-react'
import { tts, sfx, voiceFeedback } from '@/lib/speechServices'

interface VoiceCommand {
  phrases: string[]
  action: () => Promise<boolean>
  icon: any
  label: string
}

export default function VoiceControl() {
  const { sendCommand, connectionState } = useRobot()
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lastCommand, setLastCommand] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const recognitionRef = useRef<any>(null)

  const isConnected = connectionState === 'connected'

  // Define voice commands
  const voiceCommands: VoiceCommand[] = [
    {
      phrases: ['wave', 'say hello', 'hello', 'hi', 'greet'],
      action: async () => sendCommand('/api/robot/gesture', { gesture: 'wave' }, 'Wave'),
      icon: Hand,
      label: 'Wave'
    },
    {
      phrases: ['point', 'point forward', 'indicate'],
      action: async () => sendCommand('/api/robot/gesture', { gesture: 'point' }, 'Point'),
      icon: Pointer,
      label: 'Point'
    },
    {
      phrases: ['stand', 'stand up', 'get up', 'rise'],
      action: async () => sendCommand('/api/robot/gesture', { gesture: 'stand' }, 'Stand'),
      icon: User,
      label: 'Stand'
    },
    {
      phrases: ['forward', 'move forward', 'go forward', 'walk', 'go ahead'],
      action: async () => sendCommand('/api/robot/walk', { movement: 'forward', duration: 2 }, 'Forward'),
      icon: ArrowUp,
      label: 'Forward'
    },
    {
      phrases: ['backward', 'move backward', 'go back', 'back', 'reverse'],
      action: async () => sendCommand('/api/robot/walk', { movement: 'backward', duration: 2 }, 'Backward'),
      icon: ArrowDown,
      label: 'Backward'
    },
    {
      phrases: ['turn left', 'left', 'rotate left'],
      action: async () => sendCommand('/api/robot/walk', { movement: 'turn_left', duration: 2 }, 'Turn Left'),
      icon: RotateCcw,
      label: 'Turn Left'
    },
    {
      phrases: ['turn right', 'right', 'rotate right'],
      action: async () => sendCommand('/api/robot/walk', { movement: 'turn_right', duration: 2 }, 'Turn Right'),
      icon: RotateCw,
      label: 'Turn Right'
    },
    {
      phrases: ['look up', 'head up'],
      action: async () => sendCommand('/api/robot/head/move', { direction: 'up' }, 'Head Up'),
      icon: ChevronUp,
      label: 'Look Up'
    },
    {
      phrases: ['look down', 'head down'],
      action: async () => sendCommand('/api/robot/head/move', { direction: 'down' }, 'Head Down'),
      icon: ChevronDown,
      label: 'Look Down'
    },
    {
      phrases: ['look left', 'head left'],
      action: async () => sendCommand('/api/robot/head/move', { direction: 'left' }, 'Head Left'),
      icon: ChevronLeft,
      label: 'Look Left'
    },
    {
      phrases: ['look right', 'head right'],
      action: async () => sendCommand('/api/robot/head/move', { direction: 'right' }, 'Head Right'),
      icon: ChevronRight,
      label: 'Look Right'
    },
    {
      phrases: ['look center', 'head center', 'center', 'look straight'],
      action: async () => sendCommand('/api/robot/head/move', { direction: 'center' }, 'Head Center'),
      icon: Eye,
      label: 'Look Center'
    },
  ]

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'
    }
  }, [])

  // Process transcript to find matching command
  const processCommand = useCallback(async (text: string) => {
    const lowerText = text.toLowerCase().trim()
    
    for (const command of voiceCommands) {
      for (const phrase of command.phrases) {
        if (lowerText.includes(phrase)) {
          setLastCommand(command.label)
          
          // Audio feedback
          if (voiceEnabled) {
            await sfx.commandReceived()
            tts.speak(`Executing ${command.label}`, { rate: 1.1 })
          }
          
          const success = await command.action()
          
          if (voiceEnabled && success) {
            await sfx.success()
          } else if (voiceEnabled && !success) {
            await voiceFeedback.error("Command failed")
          }
          
          return true
        }
      }
    }
    
    // No command matched
    if (voiceEnabled && lowerText.length > 3) {
      tts.speak("I didn't understand that command", { rate: 1.0 })
    }
    return false
  }, [voiceCommands, voiceEnabled])

  // Start/Stop listening
  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      if (voiceEnabled) {
        await sfx.listeningEnd()
      }
    } else {
      setError(null)
      setTranscript('')
      
      // Stop any TTS before listening
      tts.stop()
      
      if (voiceEnabled) {
        await sfx.listeningStart()
      }
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
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
          processCommand(finalTranscript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setError(`Error: ${event.error}`)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        if (isListening) {
          // Restart if still supposed to be listening
          try {
            recognitionRef.current.start()
          } catch (e) {
            setIsListening(false)
          }
        }
      }

      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        setError('Failed to start voice recognition')
      }
    }
  }, [isListening, processCommand])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  if (!isSupported) {
    return (
      <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-3 text-slate-400">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Voice control not supported in this browser</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isListening 
              ? 'bg-gradient-to-br from-red-500 to-pink-500 animate-pulse' 
              : 'bg-gradient-to-br from-cyan-500 to-blue-500'
          }`}>
            {isListening ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Voice Control</h3>
            <p className="text-xs text-slate-400">
              {isListening ? 'Listening...' : 'Click mic to start'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Voice Output Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setVoiceEnabled(!voiceEnabled)
              if (!voiceEnabled) {
                sfx.acknowledge()
              } else {
                tts.stop()
              }
            }}
            className={`p-2 rounded-lg transition ${
              voiceEnabled 
                ? 'bg-cyan-500/30 text-cyan-300 hover:bg-cyan-500/40' 
                : 'bg-slate-700 text-slate-500 hover:bg-slate-600'
            }`}
            title={voiceEnabled ? 'Voice feedback ON' : 'Voice feedback OFF'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          {/* Mic Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleListening()
            }}
            disabled={!isConnected}
            className={`p-3 rounded-xl transition-all ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-white/10 p-4 space-y-4">
          {/* Transcript Display */}
          <div className="bg-slate-900/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium text-slate-400">Transcript</span>
            </div>
            <p className={`text-sm min-h-[24px] ${transcript ? 'text-white' : 'text-slate-500'}`}>
              {transcript || 'Say a command...'}
            </p>
          </div>

          {/* Last Command */}
          {lastCommand && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm text-emerald-300">Executed: {lastCommand}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-300">{error}</span>
            </div>
          )}

          {/* Available Commands */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-3">Available Commands</p>
            <div className="grid grid-cols-3 gap-2">
              {voiceCommands.slice(0, 9).map((cmd) => (
                <div 
                  key={cmd.label}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-800/50 border border-white/5"
                >
                  <cmd.icon className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-500">{cmd.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="text-xs text-slate-500 space-y-1">
            <p>💡 Try saying: "wave", "move forward", "turn left", "look up"</p>
          </div>
        </div>
      )}
    </div>
  )
}
