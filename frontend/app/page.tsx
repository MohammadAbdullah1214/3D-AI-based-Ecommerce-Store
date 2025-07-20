import HeroWithProduct from "@/components/home/hero-with-product"
import FeaturedProductsWith3D from "@/components/home/featured-products-with-3d"
import CustomerReviews from "@/components/home/customer-reviews"
import HeaderWrapper from "@/app/header-wrapper"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Star, Truck, Shield, Users, CreditCard, Gift } from "lucide-react"
import Chatbot from "@/components/chatbot/chatbot"
import Footer from "@/components/layout/footer"


export default function HomePage() {
  // Category data with image paths and product counts
  const categories = [
    { name: "Electronics", image: "/images/categories/electronics.jpg", count: "120+ Products" },
    { name: "Fashion", image: "/images/categories/fashion.jpg", count: "250+ Products" },
    { name: "Home & Garden", image: "/images/categories/home-garden.jpg", count: "180+ Products" },
    { name: "Beauty", image: "/images/categories/beauty.jpg", count: "95+ Products" },
    { name: "Sports", image: "/images/categories/sports.jpg", count: "75+ Products" },
    { name: "Toys", image: "/images/categories/toys.jpg", count: "60+ Products" },
    { name: "Books", image: "/images/categories/books.jpg", count: "110+ Products" },
    { name: "Jewelry", image: "/images/categories/jewelry.jpg", count: "45+ Products" },
  ]

  return (
    <HeaderWrapper>
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
        <div className="fixed bottom-20 right-1/3 w-20 h-20 border border-[#F3C998]/10 rounded-lg rotate-12 animate-pulse delay-1500"></div>

        {/* Floating particles */}
        <div className="fixed top-1/4 left-1/3 w-2 h-2 bg-[#F3C998]/20 rounded-full animate-bounce"></div>
        <div className="fixed top-3/4 right-1/4 w-1 h-1 bg-[#F3C998]/30 rounded-full animate-bounce delay-700"></div>
        <div className="fixed top-1/2 left-1/5 w-1.5 h-1.5 bg-[#F3C998]/25 rounded-full animate-bounce delay-300"></div>

        <div className="relative z-10 min-h-screen w-full">
          <main className="flex-1">
            {/* Hero Section - Now uses media API to fetch 3D models from /api/products/all-images/ */}
            <HeroWithProduct />

            {/* Features Section - With glass cards */}
            <section className="py-24 relative overflow-hidden">
              <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                  <Badge
                    className="mb-4 py-2 px-4 text-sm backdrop-blur-md"
                    style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
                  >
                    Why Choose Us
                  </Badge>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Elevate Your Shopping Experience</h2>
                  <p className="text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed">
                    We're committed to providing the best shopping experience with these key benefits
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    {
                      icon: <Truck className="h-10 w-10 text-[#1D212D]" />,
                      title: "Fast Delivery",
                      description: "Free shipping on orders over $50. Same-day dispatch on orders before 2 PM.",
                    },
                    {
                      icon: <Shield className="h-10 w-10 text-[#1D212D]" />,
                      title: "Secure Payments",
                      description: "All transactions are secure and your information is protected.",
                    },
                    {
                      icon: <Star className="h-10 w-10 text-[#1D212D]" />,
                      title: "Quality Products",
                      description: "All products are carefully sourced and quality checked.",
                    },
                    {
                      icon: <Gift className="h-10 w-10 text-[#1D212D]" />,
                      title: "Easy Returns",
                      description: "30-day return policy for a full refund or exchange.",
                    },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-2xl hover:bg-white/15 transition-all duration-500 group shadow-2xl hover:shadow-[#F3C998]/10"
                    >
                      <div
                        className="p-4 rounded-xl shadow-lg w-fit mb-6 group-hover:-translate-y-1 transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: "#F3C998" }}
                      >
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-[#F3C998] transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Featured Products Section - Now uses media API to display 3D models, images, and videos */}
            <FeaturedProductsWith3D />

            {/* Categories Section - With glass effect */}
            <section className="py-24 relative overflow-hidden">
              <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                  <Badge
                    className="mb-4 py-2 px-4 text-sm backdrop-blur-md"
                    style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
                  >
                    Categories
                  </Badge>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Shop by Category</h2>
                  <p className="text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed">
                    Browse our wide selection of products across popular categories
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {categories.map((category) => (
                    <Link key={category.name} href={`/products?category=${category.name.toLowerCase()}`}>
                      <div className="group h-full rounded-2xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-500 shadow-2xl hover:shadow-[#F3C998]/10">
                        <div className="aspect-square relative">
                          <Image
                            src={category.image || "/placeholder.svg"}
                            alt={category.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1D212D]/90 via-[#1D212D]/50 to-transparent flex items-end">
                            <div className="p-6 text-white">
                              <h3 className="font-bold text-xl mb-2 group-hover:text-[#F3C998] transition-colors duration-300">
                                {category.name}
                              </h3>
                              <p className="text-sm text-gray-300">{category.count}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            {/* Customer Reviews Section */}
            <CustomerReviews />

            {/* CTA Section - With glass effect */}
            <section className="py-24 relative overflow-hidden">
              <div className="container mx-auto px-4 relative z-10">
                <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
                  <div className="relative z-10 p-12 md:p-16 text-center max-w-4xl mx-auto">
                    <Badge
                      className="mb-6 py-2 px-4 text-base backdrop-blur-md"
                      style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
                    >
                      <CreditCard className="h-4 w-4 mr-2" /> Special Offer
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Start Shopping?</h2>
                    <p className="text-xl text-gray-300 mb-10 leading-relaxed">
                      Join thousands of satisfied customers and discover our amazing products today. Sign up now and get
                      10% off your first order!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                      <Link href="/products">
                        <Button
                          size="lg"
                          className="text-[#1D212D] font-semibold hover:scale-105 transition-all duration-300 shadow-xl text-lg px-8 py-4"
                          style={{ backgroundColor: "#F3C998" }}
                        >
                          Browse Products
                          <ShoppingBag className="ml-3 h-5 w-5" />
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm text-lg px-8 py-4 bg-transparent"
                        >
                          Create Account
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
      <Chatbot />
      <Footer />
    </HeaderWrapper>
  )
}
