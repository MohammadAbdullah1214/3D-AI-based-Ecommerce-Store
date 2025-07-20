import { NextRequest, NextResponse } from "next/server"

// Mock data for reviews - in a real app, this would come from your database
const mockReviews = [
  {
    id: 1,
    product: 1,
    product_id: 1,
    user: 1,
    user_id: 1,
    user_username: "john_doe",
    rating: 5,
    comment: "Amazing product! The quality exceeded my expectations.",
    created_at: "2024-01-15T10:30:00Z",
    helpful_count: 2,
  },
  {
    id: 2,
    product: 1,
    product_id: 1,
    user: 2,
    user_id: 2,
    user_username: "jane_smith",
    rating: 4,
    comment: "Great product, fast shipping. Would recommend!",
    created_at: "2024-01-20T14:45:00Z",
    helpful_count: 1,
  },
  {
    id: 3,
    product: 2,
    product_id: 2,
    user: 3,
    user_id: 3,
    user_username: "mike_wilson",
    rating: 5,
    comment: "Perfect for my needs. Excellent customer service too!",
    created_at: "2024-01-25T09:15:00Z",
    helpful_count: 3,
  },
  {
    id: 4,
    product: 3,
    product_id: 3,
    user: 4,
    user_id: 4,
    user_username: "sarah_johnson",
    rating: 5,
    comment: "I've been shopping here for over a year now and I'm always impressed by the quality of products and the fast shipping. Highly recommended!",
    created_at: "2024-01-30T11:20:00Z",
    helpful_count: 5,
  },
  {
    id: 5,
    product: 4,
    product_id: 4,
    user: 5,
    user_id: 5,
    user_username: "michael_chen",
    rating: 5,
    comment: "My first order arrived earlier than expected and the product quality exceeded my expectations. Will definitely be shopping here again.",
    created_at: "2024-02-01T16:45:00Z",
    helpful_count: 4,
  },
  {
    id: 6,
    product: 5,
    product_id: 5,
    user: 6,
    user_id: 6,
    user_username: "emily_rodriguez",
    rating: 4,
    comment: "The customer service is exceptional. I had an issue with my order and it was resolved immediately. That's why I keep coming back!",
    created_at: "2024-02-05T13:30:00Z",
    helpful_count: 3,
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get("limit") || "6"

  try {
    // Sort reviews by creation date (newest first)
    const sortedReviews = [...mockReviews].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Apply limit
    const limitedReviews = sortedReviews.slice(0, parseInt(limit))

    return NextResponse.json(limitedReviews)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch recent reviews" },
      { status: 500 }
    )
  }
} 