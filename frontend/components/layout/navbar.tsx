"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { ThemeToggle } from "../theme-toggle"
import { ShoppingCart, User, Menu, X, Search, LogIn, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Badge } from "../ui/badge"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "../../store"
import { toggleSearch, toggleSidebar } from "../../store/slices/uiSlice"
import { clearCart } from "@/store/slices/cartSlice"
import { useAuth } from "@/hooks/useAuth"

export default function Navbar() {
  const pathname = usePathname()
  const dispatch = useDispatch()

  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const { items } = useSelector((state: RootState) => state.cart)
  const { searchOpen, sidebarOpen } = useSelector((state: RootState) => state.ui)

  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const itemCount = items.length
  const { logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    await logout();
    // Optionally close sidebar if open
    if (typeof window !== 'undefined') {
      window.location.href = "/";
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality
    dispatch(toggleSearch())
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ]

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
              AI Shop
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => dispatch(toggleSearch())} aria-label="Search">
              <Search className="h-5 w-5" />
            </Button>

            <Link href="/cart">
              <Button variant="ghost" size="icon" aria-label="Cart">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Account">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {user?.username}
                    <p className="text-xs text-muted-foreground">{user?.role}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}

            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <Link href="/cart">
              <Button variant="ghost" size="icon" aria-label="Cart">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <Button variant="ghost" size="icon" onClick={() => dispatch(toggleSidebar())} aria-label="Toggle Menu">
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {sidebarOpen && (
          <div className="md:hidden py-4 space-y-4">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === link.href ? "text-primary" : "text-muted-foreground"
                  }`}
                  onClick={() => dispatch(toggleSidebar())}
                >
                  {link.label}
                </Link>
              ))}

              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium transition-colors hover:text-primary"
                    onClick={() => dispatch(toggleSidebar())}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="text-sm font-medium transition-colors hover:text-primary"
                    onClick={() => dispatch(toggleSidebar())}
                  >
                    My Account
                  </Link>
                  <Button
                    variant="ghost"
                    className="justify-start p-0 h-auto font-medium text-sm text-muted-foreground"
                    onClick={() => {
                      handleLogout()
                      dispatch(toggleSidebar())
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium transition-colors hover:text-primary"
                  onClick={() => dispatch(toggleSidebar())}
                >
                  Login / Register
                </Link>
              )}
            </nav>

            <div className="flex items-center">
              <Input
                type="search"
                placeholder="Search products..."
                className="flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="ghost" size="icon" className="ml-2" onClick={handleSearch}>
                <Search className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex justify-end">
              <ThemeToggle />
            </div>
          </div>
        )}

        {/* Search Bar */}
        {searchOpen && (
          <div className="py-4 border-t border-border">
            <form onSubmit={handleSearch} className="flex items-center">
              <Input
                type="search"
                placeholder="Search products..."
                className="flex-1"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" variant="ghost" size="icon" className="ml-2">
                <Search className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-2"
                onClick={() => dispatch(toggleSearch())}
              >
                <X className="h-5 w-5" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </header>
  )
}
