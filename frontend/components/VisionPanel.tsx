'use client'

import { useState } from 'react'
import { Eye, MessageSquare, Loader2, AlertCircle, Sparkles } from 'lucide-react'

interface VisionAnalysis {
  success?: boolean
  analysis?: string
  timestamp?: string
  model?: string
  error?: string
  cached?: boolean
  age_seconds?: number
}

interface VisionPanelProps {
  visionData?: VisionAnalysis
  apiBase: string
}

export default function VisionPanel({ visionData, apiBase }: VisionPanelProps) {
  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState<VisionAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const handleQuery = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`${apiBase}/api/vision/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query.trim() })
      })

      if (response.ok) {
        const result = await response.json()
        setQueryResult(result)
      } else {
        const error = await response.json()
        setQueryResult({ error: error.detail || 'Query failed' })
      }
    } catch (error) {
      setQueryResult({ error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzeNow = async () => {
    setAnalyzing(true)
    try {
      const response = await fetch(`${apiBase}/api/vision/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (response.ok) {
        const result = await response.json()
        setQueryResult(result)
      } else {
        const error = await response.json()
        setQueryResult({ error: error.detail || 'Analysis failed' })
      }
    } catch (error) {
      setQueryResult({ error: 'Network error' })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuery()
    }
  }

  const displayAnalysis = queryResult || visionData

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Vision Analysis</h3>
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
        <button
          onClick={handleAnalyzeNow}
          disabled={analyzing}
          className="px-3 py-1 text-sm bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Analyze Now
            </>
          )}
        </button>
      </div>

      {/* Analysis Display */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
        {displayAnalysis ? (
          <>
            {displayAnalysis.error ? (
              <div className="flex items-start gap-3 text-amber-400">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Vision service unavailable</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {displayAnalysis.error}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Configure Azure OpenAI credentials in backend/.env to enable
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Required: AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
                      {displayAnalysis.analysis}
                    </pre>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-700/50 text-xs">
                  <span className="text-gray-500">
                    Model: {displayAnalysis.model || 'gpt-4o'}
                  </span>
                  <span className="text-gray-500">
                    {displayAnalysis.timestamp && new Date(displayAnalysis.timestamp).toLocaleTimeString()}
                    {displayAnalysis.cached && ' (cached)'}
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No vision analysis yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Click &quot;Analyze Now&quot; or ask a question below
            </p>
          </div>
        )}
      </div>

      {/* Query Interface */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          <h4 className="text-sm font-medium text-white">Ask About the Scene</h4>
        </div>

        <div className="space-y-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="E.g., 'What objects do you see?', 'Is there a person nearby?', 'Describe the environment'"
            className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={2}
            disabled={loading}
          />

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setQuery('What objects do you see?')}
                className="px-2 py-1 text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded transition-colors"
              >
                Objects
              </button>
              <button
                onClick={() => setQuery('Is there any obstacle in front of you?')}
                className="px-2 py-1 text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded transition-colors"
              >
                Obstacles
              </button>
              <button
                onClick={() => setQuery('Describe the environment')}
                className="px-2 py-1 text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded transition-colors"
              >
                Environment
              </button>
            </div>

            <button
              onClick={handleQuery}
              disabled={loading || !query.trim()}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Asking...
                </>
              ) : (
                'Ask'
              )}
            </button>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <p className="text-xs text-gray-500">
            💡 Tip: Press Enter to ask, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
