/**
 * Speech Services - Text-to-Speech and Speech Recognition utilities
 * Provides voice interaction capabilities for the Klarix Robot
 */

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined'

// ============================================
// TEXT-TO-SPEECH (TTS) SERVICE
// ============================================

interface TTSOptions {
  rate?: number      // 0.1 to 10, default 1
  pitch?: number     // 0 to 2, default 1
  volume?: number    // 0 to 1, default 1
  voice?: string     // Voice name or partial match
  lang?: string      // Language code (e.g., 'en-US')
}

class TextToSpeechService {
  private synth: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []
  private preferredVoice: SpeechSynthesisVoice | null = null
  private isReady = false
  private queue: Array<{ text: string; options?: TTSOptions }> = []
  private isSpeaking = false

  constructor() {
    if (isBrowser && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      this.loadVoices()
      
      // Voices may load asynchronously
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices()
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return
    
    this.voices = this.synth.getVoices()
    
    // Prefer high-quality English voices
    const preferredVoiceNames = [
      'Samantha',           // macOS high quality
      'Google UK English Female',
      'Google US English',
      'Microsoft Zira',
      'Microsoft David',
      'Karen',              // macOS Australian
      'Daniel',             // macOS British
    ]
    
    for (const name of preferredVoiceNames) {
      const voice = this.voices.find(v => v.name.includes(name))
      if (voice) {
        this.preferredVoice = voice
        break
      }
    }
    
    // Fallback to first English voice
    if (!this.preferredVoice) {
      this.preferredVoice = this.voices.find(v => v.lang.startsWith('en')) || this.voices[0]
    }
    
    this.isReady = this.voices.length > 0
    console.log(`🔊 TTS ready with ${this.voices.length} voices. Using: ${this.preferredVoice?.name}`)
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }

  setVoice(voiceName: string) {
    const voice = this.voices.find(v => 
      v.name.toLowerCase().includes(voiceName.toLowerCase())
    )
    if (voice) {
      this.preferredVoice = voice
      console.log(`🔊 Voice set to: ${voice.name}`)
    }
  }

  /**
   * Speak text with optional configuration
   */
  speak(text: string, options?: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth || !this.isReady) {
        console.warn('TTS not available')
        resolve()
        return
      }

      // Cancel any ongoing speech if we want immediate response
      this.synth.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      
      // Apply options
      utterance.rate = options?.rate ?? 1.0
      utterance.pitch = options?.pitch ?? 1.0
      utterance.volume = options?.volume ?? 1.0
      utterance.lang = options?.lang ?? 'en-US'
      
      // Set voice
      if (options?.voice) {
        const voice = this.voices.find(v => v.name.includes(options.voice!))
        if (voice) utterance.voice = voice
      } else if (this.preferredVoice) {
        utterance.voice = this.preferredVoice
      }

      utterance.onend = () => {
        this.isSpeaking = false
        resolve()
      }
      
      utterance.onerror = (event) => {
        this.isSpeaking = false
        console.error('TTS error:', event.error)
        resolve() // Don't reject, just continue
      }

      this.isSpeaking = true
      this.synth.speak(utterance)
    })
  }

  /**
   * Speak with robot personality - slightly robotic but friendly
   */
  speakAsRobot(text: string): Promise<void> {
    return this.speak(text, {
      rate: 0.95,
      pitch: 1.05,
      volume: 1.0
    })
  }

  /**
   * Quick confirmation sounds/phrases
   */
  confirm(type: 'success' | 'error' | 'acknowledge' = 'acknowledge'): Promise<void> {
    const phrases = {
      success: ['Done!', 'Got it!', 'Completed!', 'All done!'],
      error: ['Oops!', 'Sorry, that failed.', 'I couldn\'t do that.'],
      acknowledge: ['Okay!', 'On it!', 'Sure!', 'Right away!']
    }
    const phrase = phrases[type][Math.floor(Math.random() * phrases[type].length)]
    return this.speak(phrase, { rate: 1.1 })
  }

  stop() {
    if (this.synth) {
      this.synth.cancel()
      this.isSpeaking = false
    }
  }

  get speaking(): boolean {
    return this.isSpeaking
  }

  get available(): boolean {
    return this.isReady
  }
}

// ============================================
// SOUND EFFECTS SERVICE
// ============================================

class SoundEffectsService {
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()

  constructor() {
    if (isBrowser) {
      // Create AudioContext on first user interaction
      this.initOnInteraction()
    }
  }

  private initOnInteraction() {
    const init = () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      document.removeEventListener('click', init)
      document.removeEventListener('keydown', init)
    }
    document.addEventListener('click', init, { once: true })
    document.addEventListener('keydown', init, { once: true })
  }

  private ensureContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  /**
   * Play a synthesized beep sound
   */
  beep(frequency: number = 800, duration: number = 150, type: OscillatorType = 'sine'): Promise<void> {
    return new Promise((resolve) => {
      this.ensureContext()
      if (!this.audioContext) {
        resolve()
        return
      }

      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      
      oscillator.frequency.value = frequency
      oscillator.type = type
      
      // Envelope for smooth sound
      const now = this.audioContext.currentTime
      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01)
      gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000)
      
      oscillator.start(now)
      oscillator.stop(now + duration / 1000)
      
      oscillator.onended = () => resolve()
    })
  }

  /**
   * Play success sound (ascending tones)
   */
  async success(): Promise<void> {
    await this.beep(523, 100) // C5
    await this.beep(659, 100) // E5
    await this.beep(784, 150) // G5
  }

  /**
   * Play error sound (descending)
   */
  async error(): Promise<void> {
    await this.beep(400, 200, 'square')
    await this.beep(300, 300, 'square')
  }

  /**
   * Play acknowledgment sound (single pleasant tone)
   */
  async acknowledge(): Promise<void> {
    await this.beep(880, 100)
  }

  /**
   * Play listening start sound
   */
  async listeningStart(): Promise<void> {
    await this.beep(440, 80)
    await this.beep(880, 120)
  }

  /**
   * Play listening end sound
   */
  async listeningEnd(): Promise<void> {
    await this.beep(880, 80)
    await this.beep(440, 100)
  }

  /**
   * Play command received sound
   */
  async commandReceived(): Promise<void> {
    await this.beep(600, 50)
    await this.beep(800, 80)
  }
}

// ============================================
// EXPORTS - Singleton instances
// ============================================

export const tts = new TextToSpeechService()
export const sfx = new SoundEffectsService()

// Combined helper for voice feedback
export const voiceFeedback = {
  /**
   * Speak AI response with optional sound effect
   */
  async speakResponse(text: string, playSound = true): Promise<void> {
    if (playSound) {
      await sfx.acknowledge()
    }
    await tts.speakAsRobot(text)
  },

  /**
   * Announce command execution
   */
  async announceCommand(command: string): Promise<void> {
    await sfx.commandReceived()
    await tts.speak(`Executing ${command}`, { rate: 1.1 })
  },

  /**
   * Success feedback
   */
  async success(message?: string): Promise<void> {
    await sfx.success()
    if (message) {
      await tts.speak(message, { rate: 1.0 })
    }
  },

  /**
   * Error feedback
   */
  async error(message?: string): Promise<void> {
    await sfx.error()
    if (message) {
      await tts.speak(message, { rate: 0.9 })
    }
  },

  /**
   * Stop all audio
   */
  stop(): void {
    tts.stop()
  }
}
