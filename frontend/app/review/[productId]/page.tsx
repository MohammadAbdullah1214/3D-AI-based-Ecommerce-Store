"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGetProductQuery } from "@/store/services/productApi"
import { useAddProductReviewMutation } from "@/store/services/reviewApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Star, ArrowLeft, MessageSquare } from "lucide-react"
import Link from "next/link"
import HeaderWrapper from "@/app/header-wrapper"
import Footer from "@/components/layout/footer"

export default function WriteReviewPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const productId = typeof params?.productId === "string" ? Number(params.productId) : 0

  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: product, isLoading } = useGetProductQuery(productId)
  const [addReview] = useAddProductReviewMutation()

  const handleRatingChange = (rating: number) => {
    setReviewForm((prev) => ({ ...prev, rating }))
  }

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReviewForm((prev) => ({ ...prev, comment: e.target.value }))
  }

  const handleSubmitReview = async () => {
    if (reviewForm.rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      })
      return
    }

    if (!reviewForm.comment.trim()) {
      toast({
        title: "Comment required",
        description: "Please write a comment before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await addReview({
        product_id: productId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      }).unwrap()

      toast({
        title: "Review submitted successfully!",
        description: "Thank you for your feedback. Your review will appear on the product page and homepage.",
      })

      // Redirect back to the product page after successful submission
      setTimeout(() => {
        router.push(`/products/${productId}`)
      }, 2000)
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error submitting review",
        description: "There was a problem submitting your review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D]">
        <div className="relative w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-[#F3C998] border-r-transparent border-b-[#F3C998]/50 border-l-transparent animate-spin"></div>
          <div className="absolute top-2 left-2 w-20 h-20 rounded-full border-4 border-t-transparent border-r-[#F3C998]/70 border-b-transparent border-l-[#F3C998] animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D] relative">
        <div className="fixed inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #F3C998 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, #F3C998 0%, transparent 50%)`,
            }}
          ></div>
        </div>

        <HeaderWrapper>
          <div className="relative z-10 min-h-screen w-full p-4 md:p-8 flex items-center justify-center">
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl max-w-md">
              <CardHeader>
                <CardTitle className="text-red-400">Product Not Found</CardTitle>
                <CardDescription className="text-gray-300">
                  The product you're trying to review could not be found.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
              </CardContent>
            </Card>
          </div>
          <Footer />
        </HeaderWrapper>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1D212D] via-[#2A2F3A] to-[#1D212D] relative">
      {/* Full screen background pattern */}
      <div className="fixed inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #F3C998 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #F3C998 0%, transparent 50%)`,
          }}
        ></div>
      </div>

      {/* Animated geometric shapes */}
      <div className="fixed top-20 left-10 w-32 h-32 border border-[#F3C998]/10 rounded-full animate-pulse"></div>
      <div className="fixed top-40 right-20 w-24 h-24 border border-[#F3C998]/15 rounded-lg rotate-45 animate-pulse delay-1000"></div>
      <div className="fixed bottom-32 left-1/4 w-16 h-16 bg-[#F3C998]/5 rounded-full animate-pulse delay-500"></div>

      <HeaderWrapper>
        <div className="relative z-10 min-h-screen w-full p-4 md:p-8">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Write a Review</h1>
                <p className="text-gray-300 text-lg">Share your experience with this product</p>
              </div>
            </div>

            {/* Product Info */}
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white text-xl">Product Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-8 w-8 text-[#F3C998]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">{product.name}</h3>
                    <p className="text-gray-300 text-sm">Product ID: {product.id}</p>
                    <p className="text-gray-400 text-sm">Category: {product.category_name || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Form */}
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white text-xl">Your Review</CardTitle>
                <CardDescription className="text-gray-300">
                  Rate this product and share your thoughts with other customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-white mb-4">Your Rating</label>
                  <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleRatingChange(i + 1)}
                        className="focus:outline-none transform hover:scale-110 transition-transform duration-200"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            i < reviewForm.rating
                              ? "text-[#F3C998] fill-[#F3C998]"
                              : "text-gray-400 hover:text-[#F3C998]"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {reviewForm.rating === 0
                      ? "Select your rating"
                      : reviewForm.rating === 1
                        ? "Poor"
                        : reviewForm.rating === 2
                          ? "Fair"
                          : reviewForm.rating === 3
                            ? "Good"
                            : reviewForm.rating === 4
                              ? "Very Good"
                              : "Excellent"}
                  </p>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Your Review</label>
                  <Textarea
                    placeholder="Share your thoughts about this product... What did you like? What could be improved? Your review will help other customers make informed decisions."
                    value={reviewForm.comment}
                    onChange={handleCommentChange}
                    rows={6}
                    className="bg-white/5 border-white/20 text-white placeholder-gray-400 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    {reviewForm.comment.length}/500 characters
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={isSubmitting || reviewForm.rating === 0 || !reviewForm.comment.trim()}
                    className="bg-[#F3C998] text-[#1D212D] hover:bg-[#F3C998]/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-[#F3C998]/20">
                    <MessageSquare className="h-6 w-6 text-[#F3C998]" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Where Your Review Will Appear</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• <strong>Product Page:</strong> Other customers will see your review when browsing this product</li>
                      <li>• <strong>Homepage:</strong> Your review may appear in the customer reviews section</li>
                      <li>• <strong>Seller Dashboard:</strong> The seller will see your feedback in their product management</li>
                      <li>• <strong>Your Profile:</strong> You can view all your reviews in your account dashboard</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </HeaderWrapper>
    </div>
  )
} 