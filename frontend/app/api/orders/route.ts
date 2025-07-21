import { NextResponse } from "next/server"

// Mock orders data with delivered orders
const mockOrders = [
  {
    id: 1,
    customer: 1,
    customer_username: "customer1",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:45:00Z",
    status: "delivered",
    total_price: "299.99",
    items: [
      {
        id: 1,
        order: 1,
        product: 1,
        product_details: {
          id: 1,
          name: "Wireless Headphones",
          description: "High-quality wireless headphones with noise cancellation",
          price: 299.99,
          category: 1,
          category_name: "Electronics",
          seller: 2,
          seller_username: "techstore",
          images: ["headphones1.jpg", "headphones2.jpg"],
          stock: 50,
          rating: 4.5,
          review_count: 128,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        quantity: 1,
        price: 299.99,
        subtotal: 299.99,
      },
    ],
    payment: {
      id: 1,
      order: 1,
      amount: 299.99,
      payment_method: "credit_card",
      status: "completed",
      transaction_id: "txn_123456789",
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
    shipping_address: "123 Main St, City, State 12345",
    tracking_number: "TRK123456789",
    notes: "Please deliver during business hours",
  },
  {
    id: 2,
    customer: 1,
    customer_username: "customer1",
    created_at: "2024-01-10T09:15:00Z",
    updated_at: "2024-01-18T16:20:00Z",
    status: "delivered",
    total_price: "89.99",
    items: [
      {
        id: 2,
        order: 2,
        product: 3,
        product_details: {
          id: 3,
          name: "Smart Watch",
          description: "Feature-rich smartwatch with health tracking",
          price: 89.99,
          category: 1,
          category_name: "Electronics",
          seller: 2,
          seller_username: "techstore",
          images: ["smartwatch1.jpg", "smartwatch2.jpg"],
          stock: 25,
          rating: 4.2,
          review_count: 89,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        quantity: 1,
        price: 89.99,
        subtotal: 89.99,
      },
    ],
    payment: {
      id: 2,
      order: 2,
      amount: 89.99,
      payment_method: "paypal",
      status: "completed",
      transaction_id: "txn_987654321",
      created_at: "2024-01-10T09:15:00Z",
      updated_at: "2024-01-10T09:15:00Z",
    },
    shipping_address: "123 Main St, City, State 12345",
    tracking_number: "TRK987654321",
    notes: null,
  },
  {
    id: 3,
    customer: 1,
    customer_username: "customer1",
    created_at: "2024-01-25T11:00:00Z",
    updated_at: "2024-01-25T11:00:00Z",
    status: "pending",
    total_price: "149.99",
    items: [
      {
        id: 3,
        order: 3,
        product: 5,
        product_details: {
          id: 5,
          name: "Running Shoes",
          description: "Comfortable running shoes for all terrains",
          price: 149.99,
          category: 4,
          category_name: "Sports",
          seller: 3,
          seller_username: "sportsworld",
          images: ["shoes1.jpg", "shoes2.jpg"],
          stock: 30,
          rating: 4.7,
          review_count: 156,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        quantity: 1,
        price: 149.99,
        subtotal: 149.99,
      },
    ],
    payment: {
      id: 3,
      order: 3,
      amount: 149.99,
      payment_method: "credit_card",
      status: "pending",
      transaction_id: "txn_555666777",
      created_at: "2024-01-25T11:00:00Z",
      updated_at: "2024-01-25T11:00:00Z",
    },
    shipping_address: "123 Main St, City, State 12345",
    tracking_number: null,
    notes: null,
  },
]

export async function GET() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json(mockOrders)
}

export async function POST(request: Request) {
  const body = await request.json()
  
  // Simulate creating a new order
  const newOrder = {
    id: Math.floor(Math.random() * 1000) + 4,
    customer: 1,
    customer_username: "customer1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "pending",
    total_price: body.total_price || "0.00",
    items: body.items || [],
    payment: {
      id: Math.floor(Math.random() * 1000) + 4,
      order: Math.floor(Math.random() * 1000) + 4,
      amount: parseFloat(body.total_price) || 0,
      payment_method: body.payment_method || "credit_card",
      status: "pending",
      transaction_id: `txn_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    shipping_address: body.shipping_address || "",
    tracking_number: null,
    notes: body.notes || null,
  }

  return NextResponse.json(newOrder, { status: 201 })
} 