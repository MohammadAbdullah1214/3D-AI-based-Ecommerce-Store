import { NextResponse } from 'next/server';

export async function GET() {
  // Mock wishlist data
  const wishlist = [
    {
      id: 1,
      product_id: 101,
      name: 'Sample Product 1',
      image: '/placeholder.jpg',
      notes: 'A cool product',
      variant_id: 1,
    },
    {
      id: 2,
      product_id: 102,
      name: 'Sample Product 2',
      image: '/placeholder.jpg',
      notes: '',
      variant_id: 2,
    },
  ];
  return NextResponse.json(wishlist);
} 