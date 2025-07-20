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
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id)
    const reviews = mockReviews.filter(review => review.product_id === productId)

    return NextResponse.json(reviews)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id)
    const body = await request.json()
    const { rating, comment, user_id = 1, user_username = "user" } = body

    // Validate required fields
    if (!rating || !comment) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    // Create new review
    const newReview = {
      id: mockReviews.length + 1,
      product: productId,
      product_id: productId,
      user: user_id,
      user_id,
      user_username,
      rating: parseInt(rating),
      comment,
      created_at: new Date().toISOString(),
      helpful_count: 0,
    }

    // In a real app, you would save this to your database
    mockReviews.push(newReview)

    return NextResponse.json(newReview, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    )
  }
} 