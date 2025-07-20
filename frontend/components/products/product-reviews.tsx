"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Star } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'

interface Review {
  id: string
  user: string
  user_username: string
  rating: number
  comment: string
  created_at: string
}

interface ProductReviewsProps {
  reviews: Review[]
  productId: string
}

export default function ProductReviews({ reviews, productId }: ProductReviewsProps) {
  const { isAuthenticated, accessToken } = useSelector((state: RootState) => state.auth)
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleRatingChange = (rating: number) => {
    setNewReview((prev) => ({ ...prev, rating }))
  }

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewReview((prev) => ({ ...prev, comment: e.target.value }))
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newReview.rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      })
      return
    }

    if (!newReview.comment.trim()) {
      toast({
        title: "Comment required",
        description: "Please write a comment before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Debug: Log the product ID being used
    console.log('Submitting review for product ID:', productId)
    console.log('Review data:', newReview)
    console.log('Is authenticated:', isAuthenticated)
    console.log('Access token exists:', !!accessToken)

    try {
      const requestUrl = `/api/products/${productId}/add-review/`
      console.log('Request URL:', requestUrl)
      
      // Submit to Django API endpoint
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
        },
        body: JSON.stringify(newReview)
      });

      console.log('Response status:', response.status)
      console.log('Response URL:', response.url)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.log('Error response body:', errorText)
        throw new Error(`Failed to submit review: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log('Success response:', responseData)

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
        variant: "default",
      });

      // Reset form
      setNewReview({ rating: 0, comment: "" });

      // In a real app, you would refresh the reviews
    } catch (error) {
      console.error('Review submission error:', error)
      toast({
        title: "Error submitting review",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 dark:border-gray-800 pb-4 last:border-0">
              <div className="flex justify-between mb-2">
                <div className="font-medium">{review.user_username}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </div>
              </div>

              <div className="flex mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                ))}
              </div>

              <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first to review this product!</p>
        </div>
      )}

      {isAuthenticated ? (
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <h3 className="text-lg font-medium">Write a Review</h3>

          <div>
            <div className="mb-2">Your Rating</div>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} type="button" onClick={() => handleRatingChange(i + 1)} className="focus:outline-none">
                  <Star
                    className={`h-6 w-6 ${
                      i < newReview.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Textarea
              placeholder="Share your thoughts about this product..."
              value={newReview.comment}
              onChange={handleCommentChange}
              rows={4}
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      ) : (
        <div className="text-center py-4 border border-gray-200 dark:border-gray-800 rounded-md">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Please log in to write a review.</p>
          <Button asChild>
            <a href="/login">Log In to Review</a>
          </Button>
        </div>
      )}
    </div>
  )
}
