'use client'

import { useState, useCallback } from 'react'
import { Sparkles, Send, Loader2, Eye, AlertCircle, Lightbulb, Box, MapPin, Shield, Zap } from 'lucide-react'
import { tts } from '@/lib/speechServices'

interface VisionPanelProps {
  isConnected: boolean
  className?: string
}

interface AnalysisResult {
  success: boolean
  analysis: string
  timestamp: string
  model?: string
  error?: string
}

export default function VisionPanel({ isConnected, className = '' }: VisionPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [question, setQuestion] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const API_BASE = 'http://localhost:8000'

  const analyzeScene = useCallback(async () => {
    if (!isConnected) return
    
    setIsAnalyzing(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE}/api/vision/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Analysis failed')
      }
      
      const result = await response.json()
      setAnalysis(result)

      // Speak the analysis result
      if (result.success && result.analysis) {
        const cleanText = result.analysis.replace(/[^\w\s.,!?'-]/g, '').trim()
        await tts.speakAsRobot(cleanText)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }, [isConnected])

  const askQuestion = useCallback(async () => {
    if (!isConnected || !question.trim()) return
    
    setIsAnalyzing(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE}/api/vision/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() })
      })
      
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Query failed')
      }
      
      const result = await response.json()
      setAnalysis(result)
      setQuestion('')

      // Speak the answer
      if (result.success && result.analysis) {
        const cleanText = result.analysis.replace(/[^\w\s.,!?'-]/g, '').trim()
        await tts.speakAsRobot(cleanText)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed')
    } finally {
      setIsAnalyzing(false)
    }
  }, [isConnected, question])

  const parseAnalysis = (text: string) => {
    // Try to parse as JSON first
    try {
      const json = JSON.parse(text)
      return json
    } catch {
      // Return as plain text
      return { raw: text }
    }
  }

  const renderAnalysisContent = () => {
    if (!analysis) return null
    
    const parsed = parseAnalysis(analysis.analysis)
    
    if (parsed.raw) {
      return (
        <div className="text-sm text-slate-300 whitespace-pre-wrap">
          {parsed.raw}
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {parsed.objects && (
          <div>
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
              <Box className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Objects</span>
            </div>
            <p className="text-sm text-slate-300">{Array.isArray(parsed.objects) ? parsed.objects.join(', ') : parsed.objects}</p>
          </div>
        )}
        
        {parsed.environment && (
          <div>
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <MapPin className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Environment</span>
            </div>
            <p className="text-sm text-slate-300">{parsed.environment}</p>
          </div>
        )}
        
        {parsed.layout && (
          <div>
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Layout</span>
            </div>
            <p className="text-sm text-slate-300">{parsed.layout}</p>
          </div>
        )}
        
        {parsed.safety && (
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Safety</span>
            </div>
            <p className="text-sm text-slate-300">{parsed.safety}</p>
          </div>
        )}
        
        {parsed.actions && (
          <div>
            <div className="flex items-center gap-2 text-pink-400 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Actions</span>
            </div>
            <p className="text-sm text-slate-300">{Array.isArray(parsed.actions) ? parsed.actions.join(', ') : parsed.actions}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          AI Vision (GPT-4o)
        </h2>
        
        <button
          onClick={analyzeScene}
          disabled={!isConnected || isAnalyzing}
          className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 
            hover:from-purple-400 hover:to-pink-400 text-white rounded-lg transition-all
            disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Eye className="w-3 h-3" />
              Analyze Scene
            </>
          )}
        </button>
      </div>

      {/* Question Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
          placeholder="Ask about what the robot sees..."
          disabled={!isConnected || isAnalyzing}
          className="flex-1 px-3 py-2 text-sm bg-slate-900/50 border border-white/10 rounded-lg
            text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={askQuestion}
          disabled={!isConnected || isAnalyzing || !question.trim()}
          className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Questions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['What objects are visible?', 'Is the path clear?', 'Describe the room'].map((q) => (
          <button
            key={q}
            onClick={() => { setQuestion(q); }}
            disabled={!isConnected}
            className="px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 
              rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <Lightbulb className="w-3 h-3" />
            {q}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
            <div>
              <p className="text-sm text-red-300">{error}</p>
              {error.includes('Azure OpenAI') && (
                <p className="text-xs text-red-400/70 mt-1">
                  Configure credentials in backend/.env file
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="bg-slate-900/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">
              {new Date(analysis.timestamp).toLocaleTimeString()}
            </span>
            {analysis.model && (
              <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                {analysis.model}
              </span>
            )}
          </div>
          {renderAnalysisContent()}
        </div>
      )}

      {/* Empty State */}
      {!analysis && !error && !isAnalyzing && (
        <div className="text-center py-6 text-slate-500">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Click "Analyze Scene" to see AI insights</p>
          <p className="text-xs mt-1">Or ask a question about what the robot sees</p>
        </div>
      )}
    </div>
  )
}
