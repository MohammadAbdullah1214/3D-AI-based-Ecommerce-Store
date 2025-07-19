import { useCallback, useEffect, useRef } from 'react'
import { useTrackBehaviorMutation } from '@/store/services/chatbotApi'

interface BehaviorTrackingOptions {
  sessionId: string
  enabled?: boolean
  debounceMs?: number
}

interface TrackingData {
  product_id?: number
  category_id?: number
  search_query?: string
  price_range?: [number, number]
  [key: string]: any
}

export const useBehaviorTracking = ({ sessionId, enabled = true, debounceMs = 1000 }: BehaviorTrackingOptions) => {
  const [trackBehavior] = useTrackBehaviorMutation()
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActionRef = useRef<string | null>(null)

  const trackAction = useCallback(async (
    action: "view_product" | "add_to_cart" | "remove_from_cart" | "search" | "category_browse" | "price_filter",
    data: TrackingData = {}
  ) => {
    if (!enabled || !sessionId) return

    // Debounce similar actions
    const actionKey = `${action}-${JSON.stringify(data)}`
    if (lastActionRef.current === actionKey) {
      return
    }
    lastActionRef.current = actionKey

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Debounce the tracking
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        await trackBehavior({
          session_id: sessionId,
          action,
          data
        }).unwrap()
        
        console.log(`📊 Behavior tracked: ${action}`, data)
      } catch (error) {
        console.error('Failed to track behavior:', error)
      }
    }, debounceMs)
  }, [sessionId, enabled, debounceMs, trackBehavior])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return {
    trackAction,
    trackProductView: (productId: number) => trackAction('view_product', { product_id: productId }),
    trackAddToCart: (productId: number) => trackAction('add_to_cart', { product_id: productId }),
    trackRemoveFromCart: (productId: number) => trackAction('remove_from_cart', { product_id: productId }),
    trackSearch: (query: string) => trackAction('search', { search_query: query }),
    trackCategoryBrowse: (categoryId: number) => trackAction('category_browse', { category_id: categoryId }),
    trackPriceFilter: (minPrice: number, maxPrice: number) => trackAction('price_filter', { price_range: [minPrice, maxPrice] })
  }
} 