"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/store"
import { logout } from "@/store/slices/authSlice"
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
import { clearCart } from "@/store/slices/cartSlice"
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
  const { logout } = useAuth();

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
    await logout();
    router.push("/");
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
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm" : "bg-white dark:bg-gray-900"
      }`}
    >
      {/* Top bar with announcement or promo */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 text-center text-sm">
        <p>Free shipping on orders over $50! Use code: FREESHIP50</p>
      </div>

      <div className="container mx-auto px-4">
        {/* Main header content */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center h-full flex-shrink-0">
            <img src="/online (1).png" alt="TRICART Logo" className="h-24 w-auto object-contain p-0 m-0" />
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input
                type="search"
                placeholder="Search for products..."
                className="w-full pl-10 pr-4 rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Cart */}
            <CartIcon />

            {/* User Menu - Desktop */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.username}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders">Orders</Link>
                  </DropdownMenuItem>
                  {user?.role === "seller" && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Seller Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden rounded-full">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>

                {/* Mobile Search */}
                <div className="py-4">
                  <form onSubmit={handleSearch} className="relative w-full">
                    <Input
                      type="search"
                      placeholder="Search for products..."
                      className="w-full pl-10 pr-4"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </form>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex flex-col space-y-4 mt-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center text-sm font-medium transition-colors hover:text-primary ${
                        pathname === link.href ? "text-primary" : "text-muted-foreground"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <div className="mt-8 pt-4 border-t">
                  {isAuthenticated ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{user?.username}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Link href="/account/profile" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" size="sm" className="w-full">
                            Profile
                          </Button>
                        </Link>
                        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" size="sm" className="w-full">
                            Dashboard
                          </Button>
                        </Link>
                      </div>
                      <Link href="/account/orders" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full">
                          Orders
                        </Button>
                      </Link>
                      {user?.role === "seller" && (
                        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" size="sm" className="w-full">
                            Seller Dashboard
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
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
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full">
                          <LogIn className="h-4 w-4 mr-2" />
                          Login
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                          Register
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
                <CartIcon />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
