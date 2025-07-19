import Link from "next/link"
import { Facebook, Twitter, Instagram, GitlabIcon as GitHub, Mail } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">E-Commerce</h3>
            <p className="text-sm text-gray-600 dark:text-gray-200">
              Your one-stop shop for all your shopping needs. Quality products, competitive prices, and excellent
              customer service.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                <Facebook size={20} />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                <GitHub size={20} />
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/deals"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Special Deals
                </Link>
              </li>
              <li>
                <Link
                  href="/new-arrivals"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/contact"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Newsletter</h3>
            <p className="text-sm text-gray-600 dark:text-gray-200">
              Subscribe to our newsletter for the latest products and exclusive offers.
            </p>
            <div className="flex space-x-2">
              <Input type="email" placeholder="Your email" className="max-w-[220px]" />
              <Button type="submit" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-200">
            &copy; {new Date().getFullYear()} E-Commerce. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link
              href="/terms"
              className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              Privacy Policy
            </Link>
            <Link
              href="/cookies"
              className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
