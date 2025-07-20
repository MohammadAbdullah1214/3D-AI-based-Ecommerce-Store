"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/store"
import { Search, User, Menu, Heart, LogOut, LogIn, Package, Home, ChevronDown, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useHasMounted } from "@/utils/client-utils"
import CartIcon from "./cart-icon"
import { useAuth } from "@/hooks/useAuth"

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const { theme, setTheme } = useTheme()
  const dispatch = useDispatch()
  const hasMounted = useHasMounted()
  const router = useRouter()
  const { logout } = useAuth()

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`
    }
  }

  const navLinks = [
    { href: "/", label: "Home", icon: <Home className="h-4 w-4 mr-2" /> },
    { href: "/products", label: "Products", icon: <Package className="h-4 w-4 mr-2" /> },
    { href: "/categories", label: "Categories", icon: <ChevronDown className="h-4 w-4 mr-2" /> },
    { href: "/wishlist", label: "Wishlist", icon: <Heart className="h-4 w-4 mr-2" /> },
  ]

  // Prevent hydration mismatch by not rendering until client-side
  if (!hasMounted) {
    return null // Return a skeleton or loading state
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 relative overflow-hidden ${
        isScrolled ? "backdrop-blur-xl shadow-2xl border-b border-white/10" : "backdrop-blur-md border-b border-white/5"
      }`}
      style={{
        backgroundColor: isScrolled ? "rgba(29, 33, 45, 0.95)" : "rgba(29, 33, 45, 0.9)",
        boxShadow: isScrolled ? `0 25px 50px -12px rgba(243, 201, 152, 0.1)` : "none",
      }}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-4 left-20 w-2 h-2 rounded-full opacity-20"
          style={{ backgroundColor: "#F3C998" }}
        ></div>
        <div
          className="absolute top-6 right-32 w-1 h-1 rounded-full opacity-30"
          style={{ backgroundColor: "#F3C998" }}
        ></div>
        <div
          className="absolute bottom-2 left-40 w-1.5 h-1.5 rounded-full opacity-15"
          style={{ backgroundColor: "#F3C998" }}
        ></div>
        <div className="absolute top-3 right-24">
          <div
            className="w-1.5 h-1.5 opacity-20"
            style={{
              backgroundColor: "#F3C998",
              clipPath:
                "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
            }}
          ></div>
        </div>
      </div>

      {/* Top promotional bar */}
      <div
        className="text-white py-2.5 text-center text-sm font-medium backdrop-blur-sm border-b border-white/5"
        style={{ backgroundColor: "rgba(243, 201, 152, 0.9)" }}
      >
        <div className="container mx-auto px-4">
          <p className="animate-pulse" style={{ color: "#1D212D" }}>
            🚚 Free shipping on orders over $50! Use code: <span className="font-bold">FREESHIP50</span>
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Main header content */}
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center h-full flex-shrink-0 group">
            <div className="relative">
              <img
                src="/online (1).png"
                alt="TRICART Logo"
                className="h-20 lg:h-24 w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-lg"
              />
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-lg mx-6 lg:mx-8">
            <form onSubmit={handleSearch} className="relative w-full group">
              <Input
                type="search"
                placeholder="Search for products, brands, categories..."
                className="w-full pl-12 pr-4 h-11 rounded-full bg-white/5 backdrop-blur-sm border-2 border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-white placeholder:text-white/60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60 group-focus-within:text-white/80 transition-colors duration-200" />
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm font-medium transition-all duration-200 group ${
                  pathname === link.href ? "text-white" : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
                {pathname === link.href && (
                  <span
                    className="absolute -bottom-1 left-0 w-full h-0.5 rounded-full"
                    style={{ backgroundColor: "#F3C998" }}
                  ></span>
                )}
              </Link>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full h-10 w-10 hover:bg-white/10 transition-colors duration-200 text-white/80 hover:text-white"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" style={{ color: "#F3C998" }} />
              ) : (
                <Moon className="h-5 w-5 text-white/80" />
              )}
            </Button>

            {/* Cart */}
            <div className="relative">
              <CartIcon />
            </div>

            {/* User Menu - Desktop */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full h-10 w-10 hover:bg-white/10 transition-colors duration-200"
                  >
                    <div className="relative">
                      <User className="h-5 w-5 text-white/80" />
                      <span
                        className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2"
                        style={{ backgroundColor: "#F3C998", borderColor: "#1D212D" }}
                      ></span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 p-2 backdrop-blur-xl border-white/10"
                  style={{ backgroundColor: "rgba(29, 33, 45, 0.95)" }}
                >
                  <DropdownMenuLabel className="p-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
                      >
                        {user?.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{user?.username}</span>
                        <span className="text-xs text-white/60">{user?.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild className="cursor-pointer text-white/80 hover:text-white focus:bg-white/5">
                    <Link href="/account/profile" className="flex items-center w-full">
                      <User className="h-4 w-4 mr-3" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer text-white/80 hover:text-white focus:bg-white/5">
                    <Link href="/dashboard" className="flex items-center w-full">
                      <Package className="h-4 w-4 mr-3" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {user?.role !== "seller" && (
                    <DropdownMenuItem asChild className="cursor-pointer text-white/80 hover:text-white focus:bg-white/5">
                      <Link href="/account/orders" className="flex items-center w-full">
                        <Package className="h-4 w-4 mr-3" />
                        Orders
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer focus:bg-red-500/20 hover:bg-red-500/20"
                    style={{ color: "#F3C998" }}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden lg:flex items-center space-x-3">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-medium hover:bg-white/10 text-white/80 hover:text-white transition-colors duration-200"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-white border border-white/20"
                    style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
                  >
                    Register
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden rounded-full h-10 w-10 hover:bg-white/10 text-white/80 hover:text-white"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-80 p-0 backdrop-blur-xl border-white/10"
                style={{ backgroundColor: "rgba(29, 33, 45, 0.95)" }}
              >
                <SheetHeader className="p-6 border-b border-white/10">
                  <SheetTitle className="text-left font-bold text-lg text-white">Menu</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-full">
                  {/* Mobile Search */}
                  <div className="p-6 border-b border-white/10">
                    <form onSubmit={handleSearch} className="relative w-full">
                      <Input
                        type="search"
                        placeholder="Search products..."
                        className="w-full pl-12 pr-4 h-11 rounded-full bg-white/5 backdrop-blur-sm border-2 border-white/20 focus:border-white/40 text-white placeholder:text-white/60"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                    </form>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex-1 p-6">
                    <div className="space-y-2">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`flex items-center p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                            pathname === link.href ? "text-white" : "text-white/80 hover:text-white hover:bg-white/5"
                          }`}
                          style={{
                            backgroundColor: pathname === link.href ? "rgba(243, 201, 152, 0.1)" : "transparent",
                          }}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {link.icon}
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </nav>

                  {/* User Section */}
                  <div
                    className="p-6 border-t border-white/10"
                    style={{ backgroundColor: "rgba(243, 201, 152, 0.05)" }}
                  >
                    {isAuthenticated ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                          <div
                            className="h-12 w-12 rounded-full flex items-center justify-center font-semibold text-lg"
                            style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
                          >
                            {user?.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{user?.username}</p>
                            <p className="text-sm text-white/60">{user?.email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Link href="/account/profile" onClick={() => setMobileMenuOpen(false)}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full bg-white/5 backdrop-blur-sm border-white/20 text-white/80 hover:text-white hover:bg-white/10"
                            >
                              <User className="h-4 w-4 mr-2" />
                              Profile
                            </Button>
                          </Link>
                          <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full bg-white/5 backdrop-blur-sm border-white/20 text-white/80 hover:text-white hover:bg-white/10"
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Dashboard
                            </Button>
                          </Link>
                        </div>

                        {user?.role !== "seller" && (
                          <Link href="/account/orders" onClick={() => setMobileMenuOpen(false)}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full bg-white/5 backdrop-blur-sm border-white/20 text-white/80 hover:text-white hover:bg-white/10"
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Orders
                            </Button>
                          </Link>
                        )}

                        {user?.role === "seller" && (
                          <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full bg-white/5 backdrop-blur-sm border-white/20 text-white/80 hover:text-white hover:bg-white/10"
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Seller Dashboard
                            </Button>
                          </Link>
                        )}

                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30"
                          onClick={() => {
                            handleLogout()
                            setMobileMenuOpen(false)
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-white/5 backdrop-blur-sm border-white/20 text-white/80 hover:text-white hover:bg-white/10"
                          >
                            <LogIn className="h-4 w-4 mr-2" />
                            Login
                          </Button>
                        </Link>
                        <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                          <Button
                            size="sm"
                            className="w-full shadow-lg border border-white/20"
                            style={{ backgroundColor: "#F3C998", color: "#1D212D" }}
                          >
                            Register
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
