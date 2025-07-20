"use client"

import { useGetRecentReviewsQuery } from "@/store/services/reviewApi"
import { Badge } from "@/components/ui/badge"
import { Star, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function CustomerReviews() {
  const { data: reviews = [], isLoading } = useGetRecentReviewsQuery({ limit: 3 })

  // Fallback testimonials if no reviews are available
  const fallbackTestimonials = [
    {
      name: "Sarah Johnson",
      role: "Regular Customer",
      comment: "I've been shopping here for over a year now and I'm always impressed by the quality of products and the fast shipping. Highly recommended!",
      rating: 5,
      image: "/placeholder-user.jpg",
    },
    {
      name: "Michael Chen",
      role: "New Customer",
      comment: "My first order arrived earlier than expected and the product quality exceeded my expectations. Will definitely be shopping here again.",
      rating: 5,
      image: "/placeholder-user.jpg",
    },
    {
      name: "Emily Rodriguez",
      role: "Frequent Shopper",
      comment: "The customer service is exceptional. I had an issue with my order and it was resolved immediately. That's why I keep coming back!",
      rating: 4,
      image: "/placeholder-user.jpg",
    },
  ]

  const displayReviews = reviews.length > 0 ? reviews : fallbackTestimonials

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <Badge
            className="mb-4 py-2 px-4 text-sm backdrop-blur-md"
            style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
          >
            <Users className="h-4 w-4 mr-2" /> Customer Reviews
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">What Our Customers Say</h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed">
            Don't just take our word for it. Here's what our customers have to say about their shopping
            experience.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayReviews.map((review, index) => (
            <div
              key={index}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 h-full flex flex-col hover:bg-white/15 transition-all duration-500 shadow-2xl hover:shadow-[#F3C998]/10"
            >
              <div className="flex items-center mb-6">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < review.rating ? "fill-current" : "text-gray-400"}`}
                      style={{ color: i < review.rating ? "#F3C998" : undefined }}
                    />
                  ))}
              </div>
              <p className="text-white text-lg mb-8 flex-grow italic leading-relaxed">
                "{review.comment}"
              </p>
              <div className="flex items-center mt-auto">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-[#F3C998]/30">
                  <Image
                    src={review.image || "/placeholder-user.jpg"}
                    alt={review.user_username || review.name || "User"}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{review.user_username || review.name || "User"}</h4>
                  <p className="text-sm text-gray-300">{review.role || "Customer"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {reviews.length > 0 && (
          <div className="text-center mt-12">
            <Link href="/products">
              <button className="bg-[#F3C998] text-[#1D212D] px-8 py-3 rounded-lg font-semibold hover:bg-[#F3C998]/90 transition-all duration-300">
                Browse All Products
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
} 