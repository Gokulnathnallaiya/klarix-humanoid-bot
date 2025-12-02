'use client'

import { useState, useEffect, useRef } from 'react'
import { Eye, RefreshCw } from 'lucide-react'
import { API_CONFIG } from '@/lib/config'

interface CameraFeedProps {
  isConnected: boolean
  className?: string
  showControls?: boolean
}

export default function CameraFeed({ isConnected, className = '', showControls = true }: CameraFeedProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [streamKey, setStreamKey] = useState(Date.now())
  const imgRef = useRef<HTMLImageElement>(null)

  const STREAM_URL = API_CONFIG.CAMERA_FEED_URL

  // Refresh the stream
  const refreshStream = () => {
    setIsLoading(true)
    setHasError(false)
    setStreamKey(Date.now())
  }

  // Reset when connection changes
  useEffect(() => {
    if (isConnected) {
      refreshStream()
    }
  }, [isConnected])

  // Handle image events
  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    // Auto-retry after 3 seconds
    setTimeout(() => {
      if (isConnected) {
        refreshStream()
      }
    }, 3000)
  }

  // Offline state
  if (!isConnected) {
    return (
      <div className={`relative bg-black overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="text-center">
            <Eye className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400 font-medium">Camera Offline</p>
            <p className="text-slate-500 text-sm mt-1">Connect to robot to view feed</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative bg-black overflow-hidden ${className}`}>
      {/* MJPEG Stream - Always render the img tag */}
      <img
        ref={imgRef}
        key={streamKey}
        src={`${STREAM_URL}?t=${streamKey}`}
        alt="Robot Camera"
        className="w-full h-full object-contain"
        onLoad={handleLoad}
        onError={handleError}
        style={{ display: hasError ? 'none' : 'block' }}
      />

      {/* Loading overlay */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Connecting to camera...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="text-center px-4">
            <Eye className="w-10 h-10 mx-auto mb-3 text-amber-500" />
            <p className="text-slate-300 font-medium mb-1">Camera Error</p>
            <p className="text-slate-500 text-sm mb-4">Retrying...</p>
            {showControls && (
              <button
                onClick={refreshStream}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg flex items-center gap-2 mx-auto transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Live indicator */}
      {!isLoading && !hasError && showControls && (
        <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 bg-black/50 rounded-full">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-white font-medium">LIVE</span>
        </div>
      )}

      {/* Refresh button */}
      {showControls && (
        <button
          onClick={refreshStream}
          className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          title="Refresh stream"
        >
          <RefreshCw className="w-4 h-4 text-white" />
        </button>
      )}
    </div>
  )
}
