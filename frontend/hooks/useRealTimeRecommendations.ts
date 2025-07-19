import { useState, useEffect, useCallback, useRef } from 'react'
import { useGetRealTimeRecommendationsQuery, useGetActivityRecommendationsQuery } from '@/store/services/chatbotApi'
import type { ProductRecommendation } from '@/store/services/chatbotApi'

interface RealTimeRecommendationsOptions {
  sessionId: string
  enabled?: boolean
  pollInterval?: number
  productId?: number
}

interface ActivityRecommendationsOptions {
  sessionId: string
  enabled?: boolean
  pollInterval?: number
}

export const useRealTimeRecommendations = ({ 
  sessionId, 
  enabled = true, 
  pollInterval = 30000, // 30 seconds
  productId 
}: RealTimeRecommendationsOptions) => {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sessionStartTimeRef = useRef<number>(Date.now())

  const { data, isLoading: queryLoading, error: queryError, refetch } = useGetRealTimeRecommendationsQuery(
    { session_id: sessionId, product_id: productId },
    { 
      pollingInterval: enabled ? pollInterval : 0,
      skip: !enabled || !sessionId 
    }
  )

  const updateRecommendations = useCallback((newRecommendations: ProductRecommendation[]) => {
    setRecommendations(newRecommendations)
    setIsLoading(false)
    setError(null)
  }, [])

  useEffect(() => {
    if (data?.recommendations) {
      updateRecommendations(data.recommendations)
    }
  }, [data, updateRecommendations])

  useEffect(() => {
    if (queryError) {
      setError('Failed to fetch recommendations')
      setIsLoading(false)
    }
  }, [queryError])

  useEffect(() => {
    setIsLoading(queryLoading)
  }, [queryLoading])

  const refreshRecommendations = useCallback(async () => {
    if (!enabled || !sessionId) return
    
    setIsLoading(true)
    try {
      await refetch()
    } catch (err) {
      setError('Failed to refresh recommendations')
    }
  }, [enabled, sessionId, refetch])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
      }
    }
  }, [])

  return {
    recommendations,
    isLoading,
    error,
    refreshRecommendations,
    sessionStartTime: sessionStartTimeRef.current
  }
}

export const useActivityRecommendations = ({ 
  sessionId, 
  enabled = true, 
  pollInterval = 30000 // 30 seconds
}: ActivityRecommendationsOptions) => {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionStartTimeRef = useRef<number>(Date.now())

  const { data, isLoading: queryLoading, error: queryError, refetch } = useGetActivityRecommendationsQuery(
    { 
      session_id: sessionId, 
      seconds_elapsed: Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
    },
    { 
      pollingInterval: enabled ? pollInterval : 0,
      skip: !enabled || !sessionId 
    }
  )

  const updateRecommendations = useCallback((newRecommendations: ProductRecommendation[]) => {
    setRecommendations(newRecommendations)
    setIsLoading(false)
    setError(null)
  }, [])

  useEffect(() => {
    if (data?.recommendations) {
      updateRecommendations(data.recommendations)
    }
  }, [data, updateRecommendations])

  useEffect(() => {
    if (queryError) {
      setError('Failed to fetch activity recommendations')
      setIsLoading(false)
    }
  }, [queryError])

  useEffect(() => {
    setIsLoading(queryLoading)
  }, [queryLoading])

  const refreshRecommendations = useCallback(async () => {
    if (!enabled || !sessionId) return
    
    setIsLoading(true)
    try {
      await refetch()
    } catch (err) {
      setError('Failed to refresh activity recommendations')
    }
  }, [enabled, sessionId, refetch])

  return {
    recommendations,
    isLoading,
    error,
    refreshRecommendations,
    sessionStartTime: sessionStartTimeRef.current,
    secondsElapsed: Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
  }
} 